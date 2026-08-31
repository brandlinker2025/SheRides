"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { addPostComment, fetchPostComments, type PostComment } from "@/lib/social";
import { createClient } from "@/lib/supabase/client";
import type { FeedPost as FeedPostType } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";
import { PostMedia } from "./PostMedia";

type FeedPostProps = {
  post: FeedPostType;
  onToggleLike?: (id: string) => void;
  onToggleSave?: (id: string) => void;
  onCommented?: (id: string) => void;
  startOpen?: boolean;
};

export function FeedPost({ post, onToggleLike, onToggleSave, onCommented, startOpen }: FeedPostProps) {
  const { user } = useAuth();
  const [commentOpen, setCommentOpen] = useState(Boolean(startOpen));
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startOpen) setCommentOpen(true);
  }, [startOpen]);

  useEffect(() => {
    if (!commentOpen || loaded) return;
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;
    setLoadingComments(true);
    void fetchPostComments(supabase, post.id).then(({ comments: rows, error: loadError }) => {
      if (cancelled) return;
      if (loadError) setError(loadError);
      else setComments(rows);
      setLoaded(true);
      setLoadingComments(false);
    });
    return () => {
      cancelled = true;
    };
  }, [commentOpen, loaded, post.id]);

  async function submitComment() {
    const supabase = createClient();
    const text = draft.trim();
    if (!supabase || !user || !text || posting) return;
    setPosting(true);
    setError(null);
    const { comment, error: saveError } = await addPostComment(supabase, post.id, user.id, text, {
      fullName: user.fullName,
      avatar: user.avatar,
    });
    if (!comment) {
      setError(saveError || "Could not post this comment.");
      setPosting(false);
      return;
    }
    setComments((prev) => (prev.some((row) => row.id === comment.id) ? prev : [...prev, comment]));
    setDraft("");
    onCommented?.(post.id);
    setPosting(false);
  }

  const commentCount = Math.max(post.comments, comments.length);

  return (
    <article id={`post-${post.id}`} className="card-surface card-hover p-6 animate-fade-in-up scroll-mt-[88px]">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3 items-center">
          <Link href={`/profile/${post.author.id}`} className="w-12 h-12 rounded-full overflow-hidden">
            <Avatar src={post.author.avatar} alt={post.author.fullName} size={48} className="w-full h-full" />
          </Link>
          <div>
            <div className="flex items-center gap-1">
              <Link
                href={`/profile/${post.author.id}`}
                className="font-headline-md text-body-lg font-semibold text-on-surface hover:text-accent-magenta transition-colors"
              >
                {post.author.fullName}
              </Link>
              {post.author.verified && (
                <Icon name="verified" filled className="text-accent-magenta text-[18px]" />
              )}
            </div>
            <span className="font-body-sm text-body-sm text-tertiary">
              {post.createdAt}
              {post.location ? ` • ${post.location}` : ""}
            </span>
          </div>
        </div>
        <button type="button" className="text-tertiary hover:text-on-surface transition-colors" aria-label="More">
          <Icon name="more_horiz" />
        </button>
      </div>

      <p className="font-body-md text-body-md text-on-surface mb-4 whitespace-pre-wrap">{post.content}</p>

      {post.image && (
        <div className="rounded-xl overflow-hidden mb-4 relative aspect-[16/9] bg-black">
          <PostMedia src={post.image} />
          {post.location && (
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white font-label-caps text-label-caps flex items-center gap-1">
              <Icon name="map" size={14} /> {post.location}
            </div>
          )}
          {post.liveRoute && (
            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-accent-magenta animate-pulse" />
              <span className="font-label-caps text-label-caps text-white">Live Route</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center border-t border-surface-border pt-4 mt-4">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => onToggleLike?.(post.id)}
            className={`flex items-center gap-2 transition-colors group ${
              post.liked ? "text-accent-magenta" : "text-secondary hover:text-accent-magenta"
            }`}
          >
            <Icon
              name="favorite"
              filled={post.liked}
              className={`group-hover:scale-110 transition-transform ${post.liked ? "animate-heart-pop" : ""}`}
              key={String(post.liked)}
            />
            <span className="font-label-lg text-label-lg">{post.likes}</span>
          </button>
          <button
            type="button"
            onClick={() => setCommentOpen((v) => !v)}
            className="flex items-center gap-2 text-secondary hover:text-accent-magenta transition-colors group"
            aria-expanded={commentOpen}
            aria-label="Comments"
          >
            <Icon name="chat_bubble" className="group-hover:scale-110 transition-transform" />
            <span className="font-label-lg text-label-lg">{commentCount}</span>
          </button>
          <button type="button" className="flex items-center gap-2 text-secondary hover:text-accent-magenta transition-colors group">
            <Icon name="share" className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {post.likerAvatars.filter(Boolean).slice(0, 3).map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                className="w-8 h-8 rounded-full border-2 border-surface-container-lowest object-cover"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => onToggleSave?.(post.id)}
            className={post.saved ? "text-accent-magenta" : "text-secondary hover:text-accent-magenta"}
            aria-label="Save"
          >
            <Icon name="bookmark" filled={post.saved} />
          </button>
        </div>
      </div>

      {commentOpen && (
        <div className="mt-4 pt-4 border-t border-surface-border">
          {loadingComments && <p className="font-body-sm text-tertiary mb-3">Loading comments…</p>}
          {!loadingComments && comments.length === 0 && (
            <p className="font-body-sm text-tertiary mb-3">No comments yet. Be the first to write one.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 mb-3">
              <Link href={`/profile/${c.authorId}`} className="shrink-0 mt-0.5">
                <Avatar src={c.authorAvatar} alt={c.authorName} size={32} />
              </Link>
              <div className="min-w-0">
                <p className="font-body-sm text-body-sm text-on-surface">
                  <Link href={`/profile/${c.authorId}`} className="font-label-lg mr-2 hover:text-accent-magenta">
                    {c.authorName}
                  </Link>
                  <span className="whitespace-pre-wrap" dir="auto">
                    {c.content}
                  </span>
                </p>
                {c.createdAt ? <p className="font-body-sm text-tertiary">{c.createdAt}</p> : null}
              </div>
            </div>
          ))}
          {error ? (
            <p className="font-body-sm text-error mb-2" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                e.preventDefault();
                void submitComment();
              }}
              maxLength={2000}
              dir="auto"
              placeholder="Write a comment..."
              className="flex-1 bg-soft-off-white border border-surface-border rounded-full px-4 py-2 text-body-sm focus:outline-none focus:border-accent-magenta"
              aria-label="Write a comment"
            />
            <button
              type="button"
              onClick={() => void submitComment()}
              disabled={posting || !draft.trim()}
              className="bg-accent-magenta text-white font-label-lg px-4 rounded-full disabled:opacity-50"
            >
              Reply
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

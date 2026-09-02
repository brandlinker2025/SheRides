"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FeedPost } from "@/components/feed/FeedPost";
import { FeedPostSkeleton } from "@/components/feed/FeedPostSkeleton";
import { MembersOnSheRides, useUnfollowedRiders } from "@/components/feed/MembersOnSheRides";
import { PostComposer } from "@/components/feed/PostComposer";
import { StoriesRow } from "@/components/feed/StoriesRow";
import { RightRail } from "@/components/layout/RightRail";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { useFeed } from "@/lib/feed-context";
import { useUI } from "@/lib/ui-context";

export default function HomeFeedPage() {
  const { user } = useAuth();
  const { posts, loading, addPost, toggleLike, toggleSave, incrementComments } = useFeed();
  const { setCreateOpen } = useUI();
  const { members } = useUnfollowedRiders();
  const [focusPostId, setFocusPostId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFocusPostId(params.get("post"));
  }, []);

  useEffect(() => {
    if (!focusPostId || loading) return;
    const el = document.getElementById(`post-${focusPostId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusPostId, loading, posts]);

  return (
    <div className="p-gutter flex justify-center">
      <div className="w-full max-w-[1280px] grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-component-gap">
          {user && user.hasBirthday === false ? (
            <Link
              href="/profile"
              className="rounded-xl border border-accent-magenta/30 bg-accent-magenta/5 px-5 py-4 font-body-sm text-on-surface"
            >
              <span className="font-label-lg text-accent-magenta">Add your birthday</span>
              <span className="text-secondary"> — optional, and it stays private. SheRides can wish you each year.</span>
            </Link>
          ) : null}
          <StoriesRow />
          <MembersOnSheRides members={members} />
          <PostComposer onPost={addPost} />
          {loading &&
            Array.from({ length: 3 }).map((_, i) => <FeedPostSkeleton key={i} />)}
          {!loading && posts.length === 0 && (
            <EmptyState
              variant="feed"
              title="No posts yet. Create the first post! 🏍️"
              action={
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="px-6 py-3 bg-accent-magenta text-white rounded-full font-label-lg transition-all duration-200 hover:shadow-magenta hover:-translate-y-0.5 active:scale-95"
                >
                  Create post
                </button>
              }
            />
          )}
          {posts.map((post) => (
            <FeedPost
              key={post.id}
              post={post}
              onToggleLike={toggleLike}
              onToggleSave={toggleSave}
              onCommented={incrementComments}
              startOpen={focusPostId === post.id}
            />
          ))}
        </div>
        <RightRail />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { FeedPost } from "@/components/feed/FeedPost";
import { FeedPostSkeleton } from "@/components/feed/FeedPostSkeleton";
import { PostComposer } from "@/components/feed/PostComposer";
import { RightRail } from "@/components/layout/RightRail";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFeed } from "@/lib/feed-context";
import { useUI } from "@/lib/ui-context";

export default function HomeFeedPage() {
  const { posts, loading, addPost, toggleLike, toggleSave, incrementComments } = useFeed();
  const { setCreateOpen } = useUI();
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
        <main className="col-span-1 lg:col-span-8 flex flex-col gap-component-gap">
          <div className="px-1">
            <h1 className="text-2xl font-bold text-on-surface">News Feed</h1>
            <p className="text-sm text-secondary mt-1">Latest posts from SheRides members.</p>
          </div>

          <PostComposer onPost={addPost} />

          {loading && Array.from({ length: 3 }).map((_, i) => <FeedPostSkeleton key={i} />)}

          {!loading && posts.length === 0 && (
            <EmptyState
              variant="feed"
              title="No posts yet. Create the first post! 🏍️"
              action={
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="px-6 py-3 bg-accent-magenta text-white rounded-full font-label-lg transition-all duration-200 hover:shadow-magenta hover:-translate-y-0.5 active:scale-95 animate-scale-in"
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
        </main>

        <RightRail />
      </div>
    </div>
  );
}

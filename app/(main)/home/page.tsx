"use client";

import { FeedPost } from "@/components/feed/FeedPost";
import { PostComposer } from "@/components/feed/PostComposer";
import { StoriesRow } from "@/components/feed/StoriesRow";
import { RightRail } from "@/components/layout/RightRail";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFeed } from "@/lib/feed-context";
import { useUI } from "@/lib/ui-context";

export default function HomeFeedPage() {
  const { posts, loading, addPost, toggleLike, toggleSave } = useFeed();
  const { setCreateOpen } = useUI();

  return (
    <div className="p-gutter flex justify-center">
      <div className="w-full max-w-[1280px] grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-component-gap">
          <StoriesRow />
          <PostComposer onPost={addPost} />
          {!loading && posts.length === 0 && (
            <EmptyState
              title="এখনো কোনো পোস্ট নেই। প্রথম পোস্ট করুন! 🏍️"
              action={
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="px-6 py-3 bg-accent-magenta text-white rounded-full font-label-lg"
                >
                  Create post
                </button>
              }
            />
          )}
          {posts.map((post) => (
            <FeedPost key={post.id} post={post} onToggleLike={toggleLike} onToggleSave={toggleSave} />
          ))}
        </div>
        <RightRail />
      </div>
    </div>
  );
}

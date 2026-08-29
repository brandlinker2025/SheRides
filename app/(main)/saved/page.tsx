"use client";

import { FeedPost } from "@/components/feed/FeedPost";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFeed } from "@/lib/feed-context";

export default function SavedPage() {
  const { posts, toggleLike, toggleSave } = useFeed();
  const saved = posts.filter((p) => p.saved);

  return (
    <div className="max-w-2xl mx-auto px-container-margin-mobile py-section-gap flex flex-col gap-component-gap">
      <h1 className="font-headline-xl text-headline-xl">Saved</h1>
      {saved.length === 0 ? (
        <EmptyState title="No saved posts yet." body="Bookmark a post from the feed and it will live here." />
      ) : (
        saved.map((post) => (
          <FeedPost key={post.id} post={post} onToggleLike={toggleLike} onToggleSave={toggleSave} />
        ))
      )}
    </div>
  );
}

"use client";

import { FeedPost } from "@/components/feed/FeedPost";
import { PostComposer } from "@/components/feed/PostComposer";
import { StoriesRow } from "@/components/feed/StoriesRow";
import { RightRail } from "@/components/layout/RightRail";
import { useFeed } from "@/lib/feed-context";

export default function HomeFeedPage() {
  const { posts, addPost, toggleLike, toggleSave } = useFeed();

  return (
    <div className="p-gutter flex justify-center">
      <div className="w-full max-w-[1280px] grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-component-gap">
          <StoriesRow />
          <PostComposer onPost={addPost} />
          {posts.map((post) => (
            <FeedPost key={post.id} post={post} onToggleLike={toggleLike} onToggleSave={toggleSave} />
          ))}
        </div>
        <RightRail />
      </div>
    </div>
  );
}

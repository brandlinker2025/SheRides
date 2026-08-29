"use client";

import Link from "next/link";
import { communities, events, trendingHashtags } from "@/lib/data";
import { useFeed } from "@/lib/feed-context";

export default function ExplorePage() {
  const { posts } = useFeed();

  return (
    <div className="max-w-[1280px] mx-auto px-container-margin-mobile md:px-container-margin-desktop py-section-gap">
      <h1 className="font-headline-xl text-headline-xl mb-2">Explore</h1>
      <p className="font-body-md text-secondary mb-8">Discover riders, rides, and communities across Bangladesh.</p>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8">
        {trendingHashtags.map((h) => (
          <span key={h.tag} className="chip px-4 py-2 rounded-full font-label-lg text-label-lg text-accent-magenta whitespace-nowrap">
            {h.tag}
          </span>
        ))}
      </div>

      <h2 className="font-headline-md text-headline-md mb-4">Trending posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {posts.map((post) => (
          <article key={post.id} className="bg-surface-container-lowest rounded-xl shadow-premium overflow-hidden">
            {post.image && <img src={post.image} alt="" className="w-full aspect-video object-cover" />}
            <div className="p-5">
              <p className="font-label-lg text-label-lg mb-1">{post.author.fullName}</p>
              <p className="font-body-sm text-body-sm text-on-surface line-clamp-3">{post.content}</p>
            </div>
          </article>
        ))}
      </div>

      <h2 className="font-headline-md text-headline-md mb-4">Communities</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {communities.map((c) => (
          <Link key={c.id} href="/groups" className="bg-white rounded-xl shadow-premium overflow-hidden hover:-translate-y-0.5 transition-transform">
            <img src={c.cover} alt="" className="w-full aspect-video object-cover" />
            <div className="p-4">
              <h3 className="font-label-lg text-label-lg">{c.name}</h3>
              <p className="font-body-sm text-tertiary">{c.members.toLocaleString()} members</p>
            </div>
          </Link>
        ))}
      </div>

      <h2 className="font-headline-md text-headline-md mb-4">Upcoming rides</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {events.slice(0, 3).map((e) => (
          <Link key={e.id} href="/events" className="bg-white rounded-xl shadow-premium p-5 hover:-translate-y-0.5 transition-transform">
            <p className="font-label-caps text-label-caps text-accent-magenta mb-2">
              {e.month} {e.day}
            </p>
            <h3 className="font-label-lg text-label-lg">{e.title}</h3>
            <p className="font-body-sm text-tertiary">{e.location}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PostMedia } from "@/components/feed/PostMedia";
import { EmptyState } from "@/components/ui/EmptyState";
import { trendingHashtags } from "@/lib/data";
import { useFeed } from "@/lib/feed-context";
import { createClient } from "@/lib/supabase/client";

type CommunityPreview = { id: string; name: string; cover: string; members: number };
type EventPreview = { id: string; title: string; location: string; starts_at: string };

export default function ExplorePage() {
  const { posts } = useFeed();
  const [communities, setCommunities] = useState<CommunityPreview[]>([]);
  const [events, setEvents] = useState<EventPreview[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    void supabase
      .from("communities")
      .select("id, name, cover_url, members_count")
      .limit(6)
      .then(({ data }) =>
        setCommunities(
          (data ?? []).map((row) => ({
            id: row.id as string,
            name: row.name as string,
            cover: (row.cover_url as string) || "",
            members: (row.members_count as number) ?? 0,
          }))
        )
      );
    void supabase
      .from("events")
      .select("id, title, location, starts_at")
      .order("starts_at", { ascending: true })
      .limit(3)
      .then(({ data }) => setEvents((data ?? []) as EventPreview[]));
  }, []);

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
      {posts.length === 0 ? (
        <div className="mb-12">
          <EmptyState variant="feed" title="No posts yet. Create the first post! 🏍️" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {posts.map((post) => (
            <article key={post.id} className="card-surface card-hover overflow-hidden">
              {post.image && (
                <div className="w-full aspect-video bg-black">
                  <PostMedia src={post.image} />
                </div>
              )}
              <div className="p-5">
                <p className="font-label-lg text-label-lg mb-1">{post.author.fullName}</p>
                <p className="font-body-sm text-body-sm text-on-surface line-clamp-3">{post.content}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      <h2 className="font-headline-md text-headline-md mb-4">Communities</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {communities.map((c) => (
          <Link key={c.id} href="/groups" className="card-surface card-hover overflow-hidden">
            {c.cover && <img src={c.cover} alt="" className="w-full aspect-video object-cover" />}
            <div className="p-4">
              <h3 className="font-label-lg text-label-lg">{c.name}</h3>
              <p className="font-body-sm text-tertiary">{c.members} members</p>
            </div>
          </Link>
        ))}
      </div>

      <h2 className="font-headline-md text-headline-md mb-4">Upcoming rides</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {events.map((e) => (
          <Link key={e.id} href="/events" className="card-surface card-hover p-5">
            <p className="font-label-caps text-label-caps text-accent-magenta mb-2">
              {new Date(e.starts_at).toLocaleDateString()}
            </p>
            <h3 className="font-label-lg text-label-lg">{e.title}</h3>
            <p className="font-body-sm text-tertiary">{e.location}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

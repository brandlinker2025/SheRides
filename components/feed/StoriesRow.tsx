"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";

type StoryItem = { id: string; name: string; avatar: string };

export function StoriesRow() {
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryItem[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase
      .from("stories")
      .select("id, image_url, author:profiles!author_id(full_name, avatar_url)")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setStories(
          (data ?? []).map((row) => {
            const author = (Array.isArray(row.author) ? row.author[0] : row.author) as {
              full_name?: string;
              avatar_url?: string;
            } | null;
            return {
              id: row.id as string,
              name: author?.full_name || "Rider",
              avatar: author?.avatar_url || (row.image_url as string),
            };
          })
        );
      });
  }, []);

  return (
    <div className="card-surface p-4 flex gap-4 overflow-x-auto snap-x hide-scrollbar">
      <div className="flex flex-col items-center gap-2 snap-start flex-shrink-0 group cursor-pointer">
        <div className="relative w-16 h-16 transition-transform duration-300 group-hover:scale-105">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-surface-dim animate-[ring-spin_10s_linear_infinite]" />
          <div className="absolute inset-[3px] rounded-full flex items-center justify-center bg-soft-off-white overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover opacity-80" />
            ) : (
              <Icon name="add" className="text-accent-magenta" />
            )}
          </div>
        </div>
        <span className="font-label-caps text-label-caps text-secondary">You</span>
      </div>
      {stories.map((story) => (
        <div key={story.id} className="flex flex-col items-center gap-2 snap-start flex-shrink-0 group cursor-pointer">
          <div className="relative w-16 h-16 transition-transform duration-300 group-hover:scale-105">
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#E91E63,#e2165f,#ffb2be,#E91E63)] animate-ring-spin-slow" />
            <div className="absolute inset-[2px] rounded-full border-2 border-surface-container-lowest overflow-hidden bg-surface-container-lowest">
              <Avatar src={story.avatar} alt={story.name} size={60} className="w-full h-full" />
            </div>
          </div>
          <span className="font-label-caps text-label-caps text-on-surface">{story.name}</span>
        </div>
      ))}
    </div>
  );
}

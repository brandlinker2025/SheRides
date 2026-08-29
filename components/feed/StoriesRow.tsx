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
    <div className="bg-surface-container-lowest rounded-xl shadow-premium p-4 flex gap-4 overflow-x-auto snap-x hide-scrollbar">
      <div className="flex flex-col items-center gap-2 snap-start flex-shrink-0">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-surface-dim flex items-center justify-center bg-soft-off-white overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover opacity-80" />
          ) : (
            <Icon name="add" className="text-accent-magenta" />
          )}
        </div>
        <span className="font-label-caps text-label-caps text-secondary">You</span>
      </div>
      {stories.map((story) => (
        <div key={story.id} className="flex flex-col items-center gap-2 snap-start flex-shrink-0">
          <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-accent-magenta to-primary-container">
            <div className="w-full h-full rounded-full border-2 border-surface-container-lowest overflow-hidden">
              <Avatar src={story.avatar} alt={story.name} size={60} className="w-full h-full" />
            </div>
          </div>
          <span className="font-label-caps text-label-caps text-on-surface">{story.name}</span>
        </div>
      ))}
    </div>
  );
}

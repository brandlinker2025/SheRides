"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { formatRelativeTime, riderFromProfile } from "./profile";
import { createClient } from "./supabase/client";
import { uploadPublicImage } from "./storage";
import type { FeedPost, Rider } from "./types";

type AddPostOptions = {
  image?: File;
  location?: string;
  onProgress?: (percent: number) => void;
};

type FeedContextValue = {
  posts: FeedPost[];
  loading: boolean;
  addPost: (content: string, options?: AddPostOptions) => Promise<string | null>;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
};

const FeedContext = createContext<FeedContextValue | null>(null);

function mapPost(
  row: Record<string, unknown>,
  author: Rider,
  extras?: { liked?: boolean; saved?: boolean; likerAvatars?: string[] }
): FeedPost {
  return {
    id: row.id as string,
    author,
    content: (row.content as string) || "",
    image: (row.image_url as string) || undefined,
    location: (row.location as string) || undefined,
    createdAt: formatRelativeTime(row.created_at as string),
    likes: (row.likes_count as number) ?? 0,
    comments: (row.comments_count as number) ?? 0,
    liked: extras?.liked,
    saved: extras?.saved,
    likerAvatars: extras?.likerAvatars ?? [],
  };
}

export function FeedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setPosts([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("posts")
      .select(
        "id, content, image_url, location, created_at, likes_count, comments_count, author:profiles!author_id(*)"
      )
      .order("created_at", { ascending: false });

    let likedIds = new Set<string>();
    let savedIds = new Set<string>();
    if (user) {
      const [{ data: likes }, { data: saved }] = await Promise.all([
        supabase.from("post_likes").select("post_id").eq("user_id", user.id),
        supabase.from("saved_posts").select("post_id").eq("user_id", user.id),
      ]);
      likedIds = new Set((likes ?? []).map((row) => row.post_id as string));
      savedIds = new Set((saved ?? []).map((row) => row.post_id as string));
    }

    setPosts(
      (data ?? []).map((row) => {
        const authorRow = (Array.isArray(row.author) ? row.author[0] : row.author) as Record<string, unknown> | null;
        const author = riderFromProfile((authorRow?.id as string) || "unknown", authorRow);
        return mapPost(row as Record<string, unknown>, author, {
          liked: likedIds.has(row.id as string),
          saved: savedIds.has(row.id as string),
        });
      })
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const addPost = async (content: string, options?: AddPostOptions) => {
    const supabase = createClient();
    if (!supabase || !user) return "You need to sign in first.";
    if (!content.trim() && !options?.image) return "Write something or add a photo.";
    let imageUrl: string | undefined;
    try {
      if (options?.image) {
        imageUrl = await uploadPublicImage(supabase, "posts", user.id, options.image, options.onProgress);
      }
    } catch (error) {
      return error instanceof Error ? error.message : "Could not upload photo.";
    }
    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        content: content.trim(),
        image_url: imageUrl ?? null,
        location: options?.location?.trim() || null,
      })
      .select("id, content, image_url, location, created_at, likes_count, comments_count")
      .single();
    if (error) return error.message;
    if (data) {
      setPosts((prev) => [mapPost(data as Record<string, unknown>, user), ...prev]);
    }
    return null;
  };

  const toggleLike = (id: string) => {
    const supabase = createClient();
    const current = posts.find((p) => p.id === id);
    if (!supabase || !user || !current) return;
    const nextLiked = !current.liked;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: nextLiked, likes: nextLiked ? p.likes + 1 : Math.max(0, p.likes - 1) } : p
      )
    );
    if (nextLiked) {
      void supabase.from("post_likes").insert({ post_id: id, user_id: user.id });
    } else {
      void supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", user.id);
    }
  };

  const toggleSave = (id: string) => {
    const supabase = createClient();
    const current = posts.find((p) => p.id === id);
    if (!supabase || !user || !current) return;
    const nextSaved = !current.saved;
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, saved: nextSaved } : p)));
    if (nextSaved) void supabase.from("saved_posts").insert({ post_id: id, user_id: user.id });
    else void supabase.from("saved_posts").delete().eq("post_id", id).eq("user_id", user.id);
  };

  return (
    <FeedContext.Provider value={{ posts, loading, addPost, toggleLike, toggleSave }}>
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed must be used within FeedProvider");
  return ctx;
}

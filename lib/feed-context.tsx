"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { currentUser, initialPosts } from "./data";
import type { FeedPost } from "./types";

type FeedContextValue = {
  posts: FeedPost[];
  addPost: (content: string) => void;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
};

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);

  const addPost = (content: string) => {
    const post: FeedPost = {
      id: `local-${Date.now()}`,
      author: currentUser,
      content,
      createdAt: "Just now",
      likes: 0,
      comments: 0,
      likerAvatars: [],
    };
    setPosts((prev) => [post, ...prev]);
  };

  const toggleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const toggleSave = (id: string) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p)));
  };

  return (
    <FeedContext.Provider value={{ posts, addPost, toggleLike, toggleSave }}>
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed must be used within FeedProvider");
  return ctx;
}

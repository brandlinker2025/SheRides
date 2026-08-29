"use client";

import { useFeed } from "@/lib/feed-context";
import { CreatePostModal } from "../feed/CreatePostModal";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { addPost } = useFeed();

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased min-h-screen">
      <TopNav />
      <div className="flex pt-[72px]">
        <SideNav />
        <main className="flex-1 lg:ml-64 w-full min-w-0 pb-24 lg:pb-0">{children}</main>
      </div>
      <BottomNav />
      <CreatePostModal onPost={addPost} />
    </div>
  );
}

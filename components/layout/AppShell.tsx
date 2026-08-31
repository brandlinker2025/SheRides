"use client";

import Image from "next/image";
import { useFeed } from "@/lib/feed-context";
import { PANDA_HERO_SRC } from "@/lib/brand-art";
import { AuthGate } from "../auth/AuthGate";
import { CreatePostModal } from "../feed/CreatePostModal";
import { ChatDock } from "../messages/ChatDock";
import { BottomNav } from "./BottomNav";
import { PresenceHeartbeat } from "./PresenceHeartbeat";
import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { addPost } = useFeed();

  return (
    <AuthGate>
      <PresenceHeartbeat />
      <div className="panda-app-bg text-on-surface font-body-md antialiased min-h-screen">
        <TopNav />
        <div className="flex pt-[72px]">
          <SideNav />
          <main className="relative flex-1 lg:ml-64 w-full min-w-0 pb-24 lg:pb-0 flex flex-col min-h-[calc(100dvh-72px)]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              <Image
                src={PANDA_HERO_SRC}
                alt=""
                fill
                sizes="(min-width: 1024px) 70vw, 100vw"
                className="object-cover object-[45%_40%] opacity-[0.2] sm:opacity-[0.26]"
              />
              <div className="absolute inset-0 panda-app-veil" />
            </div>
            <div className="relative z-10 flex-1 min-h-0">{children}</div>
          </main>
        </div>
        <BottomNav />
        <ChatDock />
        <CreatePostModal onPost={addPost} />
      </div>
    </AuthGate>
  );
}

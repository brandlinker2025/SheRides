"use client";

import Image from "next/image";
import { useFeed } from "@/lib/feed-context";
import { PANDA_HERO_SRC } from "@/lib/brand-art";
import { useScrollTopOnNavigate } from "@/hooks/useScrollTopOnNavigate";
import { useUI } from "@/lib/ui-context";
import { AuthGate } from "../auth/AuthGate";
import { CreatePostModal } from "../feed/CreatePostModal";
import { ChatDock } from "../messages/ChatDock";
import { BottomNav } from "./BottomNav";
import { PresenceHeartbeat } from "./PresenceHeartbeat";
import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { addPost } = useFeed();
  const { navOpen } = useUI();
  const mainRef = useScrollTopOnNavigate<HTMLElement>();

  return (
    <AuthGate>
      <PresenceHeartbeat />
      <div className="panda-app-bg text-on-surface font-body-md antialiased h-dvh max-h-dvh overflow-hidden">
        <TopNav />
        <div className="flex h-full min-h-0 min-w-0 pt-[72px]">
          <SideNav />
          <div className="pointer-events-none fixed inset-0 top-[72px] lg:left-64 overflow-hidden" aria-hidden="true">
            <Image
              src={PANDA_HERO_SRC}
              alt=""
              fill
              sizes="(min-width: 1024px) 70vw, 100vw"
              className="object-cover object-[45%_40%] opacity-[0.2] sm:opacity-[0.26]"
            />
            <div className="absolute inset-0 panda-app-veil" />
          </div>
          {/* The inner wrapper must grow with its content. flex-1 + min-h-0 here
              shrinks long pages to the viewport and clips the bottom. */}
          <main
            id="app-main"
            ref={mainRef}
            inert={navOpen ? true : undefined}
            aria-hidden={navOpen || undefined}
            className={`relative z-10 min-w-0 flex-1 min-h-0 overscroll-contain overflow-x-hidden ${
              navOpen ? "overflow-hidden" : "overflow-y-auto"
            }`}
          >
            <div className="min-h-full pb-[calc(12.5rem+env(safe-area-inset-bottom))] lg:pb-10">{children}</div>
          </main>
        </div>
        <div inert={navOpen ? true : undefined}>
          <BottomNav />
        </div>
        <ChatDock />
        <CreatePostModal onPost={addPost} />
      </div>
    </AuthGate>
  );
}

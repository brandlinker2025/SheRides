"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { useFeed } from "@/lib/feed-context";
import { PANDA_HERO_SRC } from "@/lib/brand-art";
import { PandaHeroBanner } from "@/components/brand/PandaHeroBanner";
import { AuthGate } from "../auth/AuthGate";
import { CreatePostModal } from "../feed/CreatePostModal";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { addPost } = useFeed();
  const pathname = usePathname();
  const compactHero = pathname.startsWith("/messages");

  return (
    <AuthGate>
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
            <div className="relative z-10 shrink-0 px-4 sm:px-6 lg:px-8 pt-4">
              <PandaHeroBanner compact={compactHero} />
            </div>
            <div className="relative z-10 flex-1 min-h-0">{children}</div>
          </main>
        </div>
        <BottomNav />
        <CreatePostModal onPost={addPost} />
      </div>
    </AuthGate>
  );
}

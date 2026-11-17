"use client";

import { Suspense } from "react";
import { useScrollTopOnNavigate } from "@/hooks/useScrollTopOnNavigate";
import { AuthGate } from "../auth/AuthGate";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const mainRef = useScrollTopOnNavigate<HTMLElement>();

  return (
    <AuthGate>
      <div className="panda-app-bg text-on-surface font-body-md antialiased h-dvh overflow-hidden">
        <TopNav />
        <div className="flex pt-20 h-dvh">
          <Suspense fallback={null}>
            <SideNav />
          </Suspense>
          {/* Background art stays put while only the content scrolls */}
          <div className="pointer-events-none fixed inset-0 top-20 lg:left-64 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0 panda-app-veil" />
          </div>
          {/* Sidebar + top bar are fixed; this is the ONLY scrolling area */}
          <main
            id="app-main"
            ref={mainRef}
            className="relative z-10 flex-1 lg:ml-64 w-full min-w-0 h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain flex flex-col"
          >
            <div className="flex-1 min-h-0 pb-24 lg:pb-0">{children}</div>
          </main>
        </div>
        <BottomNav />
      </div>
    </AuthGate>
  );
}

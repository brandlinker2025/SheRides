import type { ReactNode } from "react";
import "@/components/public-app/public-app.css";

/** Light lavender frame for pages outside AppShell / AdminShell (panda art retired Nov 2026). */
export function PandaStandaloneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="public-app relative min-h-screen overflow-x-hidden">
      <div className="relative z-10 mx-auto w-full max-w-3xl px-container-margin-mobile py-section-gap">
        {children}
      </div>
    </div>
  );
}

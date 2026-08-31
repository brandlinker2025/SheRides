import type { ReactNode } from "react";
import Image from "next/image";
import { PANDA_HERO_SRC } from "@/lib/brand-art";

/** Colorful panda chrome for pages that sit outside AppShell / AdminShell. */
export function PandaStandaloneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="panda-app-bg relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Image src={PANDA_HERO_SRC} alt="" fill sizes="100vw" className="object-cover object-[40%_center] opacity-35" />
        <div className="absolute inset-0 panda-app-veil" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-3xl px-container-margin-mobile py-section-gap">
        {children}
      </div>
    </div>
  );
}

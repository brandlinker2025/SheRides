"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { InteractivePanda } from "./InteractivePanda";
import type { PandaMood } from "./panda-types";

const PANDA_ART = "/images/sherides-panda-auth.png";

export const authFieldClass =
  "w-full rounded-xl border border-white/15 bg-black/45 px-4 py-3 text-white placeholder:text-white/45 outline-none transition-all duration-300 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/30";

type AuthSceneProps = {
  children: ReactNode;
  mood: PandaMood;
  track?: number;
  speech?: string;
  admin?: boolean;
};

export function AuthScene({ children, mood, track = 0, speech, admin = false }: AuthSceneProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#120d12] text-white">
      <Image
        src={PANDA_ART}
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover object-center select-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/70 lg:bg-gradient-to-r lg:from-black/78 lg:via-black/42 lg:to-black/20" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <Link href="/" aria-label="SheRides home">
            <BrandLogo suffix={admin ? "Admin" : undefined} className="text-[34px] sm:text-[40px]" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/signup" className="hover:text-white">
              Community
            </Link>
            <Link href="/login" className="hover:text-white">
              Rides
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle className="text-white hover:bg-white/10" />
            {!admin ? (
              <Link
                href="/signup"
                className="hidden h-10 items-center rounded-full bg-[#E91E63] px-4 text-sm font-semibold text-white shadow-magenta sm:inline-flex"
              >
                Join Community
              </Link>
            ) : null}
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-6 px-4 py-4 sm:px-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-10">
          <section className="order-2 w-full lg:order-1">{children}</section>
          <section className="order-1 h-[220px] w-full sm:h-[280px] lg:order-2 lg:h-[min(72vh,620px)]">
            <InteractivePanda mood={mood} track={track} speech={speech} />
          </section>
        </main>

        <footer className="mt-auto flex flex-col items-center justify-between gap-3 px-4 py-4 text-center text-white/70 sm:flex-row sm:px-8 sm:text-left">
          <p className="text-xs sm:text-sm">© {new Date().getFullYear()} SheRides. All rights reserved.</p>
          <p className="font-medium text-[#E91E63]" style={{ fontFamily: "var(--font-butterpop), Georgia, serif" }}>
            Stronger Together ❤️
          </p>
          <p className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] text-white/80">
            <Icon name="verified_user" size={14} filled className="text-[#E91E63]" />
            Safe ❤️ Friendly ❤️ For Her
          </p>
        </footer>
      </div>
    </div>
  );
}

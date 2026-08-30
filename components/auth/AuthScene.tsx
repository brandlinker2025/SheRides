"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { InteractivePanda } from "./InteractivePanda";
import type { PandaMood } from "./panda-types";

// This component prefers a clean scene asset at:
// public/images/sherides-panda-scene-clean.png
// If that file is missing, it falls back to an inline SVG scenic background
// (sunset, mountains, cherry blossoms) so no Panda is ever baked into the
// background. Do NOT use the old "sherides-panda-scene.png" which contains
// a Panda and would show two pandas at once.
const CLEAN_SCENE = "/images/sherides-panda-scene-clean.png";

export const authFieldClass =
  "w-full rounded-xl border border-white/15 bg-black/45 px-4 py-3 text-white placeholder:text-white/45 outline-none transition-all duration-300 focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/30";

type AuthSceneProps = {
  children: ReactNode;
  mood: PandaMood;
  track?: number;
  admin?: boolean;
};

export function AuthScene({ children, mood, admin = false }: AuthSceneProps) {
  const [hasCleanScene, setHasCleanScene] = useState(true);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#120d12] text-white">
      {/* Try to load a clean scene image from public/. If it fails (404), onError will hide it
          and the inline SVG will remain visible. This wires the app so designers can drop
          public/images/sherides-panda-scene-clean.png at any time without code changes. */}
      {hasCleanScene && (
        // plain <img> is used so we can detect load failure at runtime and gracefully fall back
        <img
          src={CLEAN_SCENE}
          alt=""
          onError={() => setHasCleanScene(false)}
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-[center_right] select-none"
        />
      )}

      {/* Inline scenic SVG fallback: sunset, simple mountains, and cherry blossoms. No panda, no helmet. */}
      {!hasCleanScene && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 flex items-center justify-end">
          <svg className="h-full w-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ffb347" />
                <stop offset="60%" stopColor="#ff8a80" />
                <stop offset="100%" stopColor="#120d12" />
              </linearGradient>
            </defs>
            <rect width="1200" height="800" fill="url(#g1)" />
            {/* sun */}
            <circle cx="920" cy="140" r="80" fill="#ffd27f" opacity="0.9" />
            {/* mountains */}
            <path d="M0 600 L220 360 L380 520 L560 320 L760 560 L1200 300 L1200 800 L0 800 Z" fill="#2b2a3a" opacity="0.9" />
            <path d="M0 700 L200 420 L420 620 L640 380 L900 680 L1200 420 L1200 800 L0 800 Z" fill="#40384a" opacity="0.85" />
            {/* cherry blossom branch (right side) */}
            <g transform="translate(820,120)" fill="#fff1f3" opacity="0.95">
              <ellipse cx="220" cy="40" rx="6" ry="8" fill="#fff" />
              <path d="M-40 240 C120 120 260 80 360 40" stroke="#ffebef" strokeWidth="8" fill="none" strokeLinecap="round" />
              <g transform="translate(280,10)">
                <circle cx="0" cy="0" r="8" fill="#ffe1e8" />
                <circle cx="24" cy="-6" r="6" fill="#fff1f3" />
                <circle cx="-24" cy="6" r="6" fill="#fff1f3" />
              </g>
            </g>
          </svg>
        </div>
      )}

      <div className="relative z-20 flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8 z-30">
          <Link href="/" aria-label="SheRides home" className="inline-block pl-3">
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

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-4 px-4 py-4 sm:px-8 lg:flex-row lg:items-start lg:justify-between">
          <section className="order-2 w-full max-w-[460px] lg:order-1 lg:mb-10 z-40">{children}</section>
          <section className="order-1 h-[230px] w-full max-w-[420px] sm:h-[300px] lg:order-2 lg:h-[min(68vh,620px)] lg:max-w-[560px] z-30 flex items-center justify-center">
            <div className="w-full h-full max-w-[560px] max-h-[620px]">
              <InteractivePanda mood={mood} />
            </div>
          </section>
        </main>

        <footer className="mt-auto flex flex-col items-center justify-between gap-3 px-4 py-4 text-center text-white/70 sm:flex-row sm:px-8 sm:text-left z-30">
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

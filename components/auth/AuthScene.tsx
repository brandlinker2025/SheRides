"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { InteractivePanda } from "./InteractivePanda";
import { HelmetMark } from "./auth-marks";
import type { PandaMood } from "./panda-types";
import "./auth-panda.css";

// Landscape-only artwork. Do not use sherides-panda-scene.png here — that file
// already contains a panda, which stacks with InteractivePanda and shows two.
const SCENE_ART = "/images/sherides-panda-scene-clean.png";

export const authFieldClass =
  "w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-white placeholder:text-white/45 outline-none transition-all duration-300 focus:border-[#FF2D78] focus:ring-2 focus:ring-[#FF2D78]/30";

type AuthSceneProps = {
  children: ReactNode;
  mood: PandaMood;
  track?: number;
  speech?: string;
  admin?: boolean;
};

export function AuthScene({ children, mood, speech, admin = false }: AuthSceneProps) {
  return (
    <div className="auth-page relative min-h-screen overflow-x-hidden bg-[#0b090c] text-white">
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Link href="/" aria-label="SheRides home" className="flex min-w-0 items-center gap-2.5">
            <HelmetMark className="h-9 w-9 shrink-0 text-[#FF2D78] sm:h-10 sm:w-10" />
            <span className="min-w-0">
              <span
                className="block truncate text-[32px] leading-none text-[#FF2D78] sm:text-[38px]"
                style={{ fontFamily: "var(--font-butterpop), Georgia, serif" }}
              >
                SheRides
                {admin ? <span className="ml-2 text-[18px] text-white/80">Admin</span> : null}
              </span>
              <span className="mt-1 hidden text-[10px] font-semibold tracking-[0.22em] text-white/70 uppercase sm:block">
                Ride · Connect · Empower
              </span>
            </span>
          </Link>

          <ThemeToggle className="text-white hover:bg-white/10" />
        </header>

        <main className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 items-stretch gap-4 px-4 pb-4 sm:px-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-8">
          <section className="order-2 flex w-full items-center lg:order-1 lg:py-4">{children}</section>
          <section className="auth-scene-panel relative order-1 h-[260px] overflow-hidden rounded-[28px] border border-white/10 sm:h-[320px] lg:order-2 lg:h-auto lg:min-h-[560px] lg:rounded-[32px]">
            <Image
              src={SCENE_ART}
              alt="SheRides sunset overlook with cherry blossoms and a motorcycle helmet"
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover object-[58%_center] select-none"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0b090c]/35 via-transparent to-transparent lg:from-[#0b090c]/20" />
            <InteractivePanda mood={mood} speech={speech} admin={admin} />
            <p className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-[11px] whitespace-nowrap text-white/90 backdrop-blur-md">
              <Icon name="verified_user" size={14} filled className="text-[#FF2D78]" />
              Safe ♥ Friendly ♥ For Her
            </p>
          </section>
        </main>

        <footer className="mt-auto grid grid-cols-1 items-center gap-3 px-4 py-4 text-center text-white/70 sm:grid-cols-[1fr_auto_1fr] sm:px-8 sm:text-left">
          <p className="text-xs sm:text-sm">© 2026 SheRides. All rights reserved.</p>
          <p
            className="font-medium text-[#FF2D78] sm:justify-self-center"
            style={{ fontFamily: "var(--font-butterpop), Georgia, serif" }}
          >
            Stronger Together ♥
          </p>
        </footer>
      </div>
    </div>
  );
}

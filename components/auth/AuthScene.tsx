import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const authBackdropClass =
  "bg-[#07040B] bg-[radial-gradient(ellipse_at_50%_0%,#382358_0%,transparent_55%),radial-gradient(ellipse_at_90%_85%,rgba(40,176,200,0.11),transparent_42%)] text-[#f8f3ff]";
export const authCardClass =
  "relative w-full rounded-[32px] border border-[#c9a7ff]/40 bg-gradient-to-br from-[#302244]/95 via-[#1c142a]/95 to-[#100c19]/95 p-6 shadow-[0_22px_80px_#07040B,inset_0_2px_0_rgba(235,214,255,0.22),inset_0_-5px_0_rgba(7,4,11,0.35)] backdrop-blur-xl sm:p-8";
export const authFieldClass =
  "w-full rounded-full border border-[#c9a7ff]/25 bg-[#100a1b]/80 px-4 py-3 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)] placeholder:text-[#c5b6dc] outline-none transition-colors focus:border-[#d2b3ff] focus:ring-2 focus:ring-[#bc95ff]/35";
export const authPrimaryClass =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-b from-[#e4cffd] to-[#aa7bf3] px-5 text-center font-semibold text-[#201031] shadow-[0_5px_0_#7047ae,0_10px_24px_rgba(157,103,242,0.25)] transition-colors hover:from-[#eedfff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ded0ff]";

export function AuthScene({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  return (
    <main className={`relative grid min-h-dvh place-items-center px-4 py-14 sm:px-8 ${authBackdropClass}`}>
      <div className="absolute right-4 top-4 sm:right-8">
        <ThemeToggle className="text-white hover:bg-white/10" />
      </div>
      <section className={`max-w-[32rem] ${authCardClass}`}>
        <Link href="/" aria-label="SheRides home" className="mx-auto mb-5 flex w-fit justify-center">
          <Logo variant="lockup" height={122} priority suffix={admin ? "Admin" : undefined} />
        </Link>
        {children}
      </section>
    </main>
  );
}

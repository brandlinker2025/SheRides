import Image from "next/image";
import { PANDA_HERO_ALT, PANDA_HERO_SRC } from "@/lib/brand-art";

export function PandaHeroBanner({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-label="SheRides panda artwork"
      className={`panda-hero-banner relative w-full overflow-hidden rounded-2xl shadow-[0_16px_40px_rgba(184,28,90,0.28)] ${
        compact ? "h-28 sm:h-36" : "h-40 sm:h-52 lg:h-64"
      }`}
    >
      <Image
        src={PANDA_HERO_SRC}
        alt={PANDA_HERO_ALT}
        fill
        priority
        sizes="(min-width: 1024px) 70vw, 100vw"
        className="object-cover object-[38%_42%] select-none"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#3a1028]/55 via-transparent to-[#c45c2a]/20" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#2a1020]/70 to-transparent" />
      <p
        className="absolute bottom-3 left-4 right-4 text-sm font-semibold tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] sm:text-base"
        style={{ fontFamily: "var(--font-butterpop), Georgia, serif" }}
      >
        Ride ♥ Support ♥ Empower
      </p>
    </section>
  );
}

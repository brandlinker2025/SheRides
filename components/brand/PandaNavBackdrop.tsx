import Image from "next/image";
import { PANDA_HERO_SRC } from "@/lib/brand-art";

/** Full-bleed panda art behind nav, with a dark scrim so labels stay readable. */
export function PandaNavBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <Image
        src={PANDA_HERO_SRC}
        alt=""
        fill
        sizes="256px"
        className="object-cover object-[18%_70%] scale-110"
      />
      <div className="absolute inset-0 bg-[#0c0408]/90" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0812]/50 via-[#12080e]/30 to-[#0c0408]/60" />
    </div>
  );
}

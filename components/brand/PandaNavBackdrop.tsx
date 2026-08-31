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
        className="object-cover object-[32%_center] scale-110"
      />
      <div className="absolute inset-0 bg-[#12080e]/84" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a1020]/40 via-[#1a0812]/25 to-[#12080e]/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0c0408]/45 to-transparent" />
    </div>
  );
}

import Image from "next/image";
import { PANDA_HERO_SRC } from "@/lib/brand-art";

/** Full-bleed panda art behind nav, darkened so labels stay readable. */
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
      <div className="absolute inset-0 bg-gradient-to-b from-[#4a1530]/88 via-[#6a1d4a]/82 to-[#2a1438]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(255,90,140,0.28),transparent_55%)]" />
    </div>
  );
}

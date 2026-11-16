import Image from "next/image";
import { PANDA_HERO_SRC } from "@/lib/brand-art";

/** Soft sky wash behind side navigation so labels and the purple wordmark stay clear. */
export function PandaNavBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <Image
        src={PANDA_HERO_SRC}
        alt=""
        fill
        sizes="256px"
        className="object-cover object-[18%_70%] scale-110 opacity-20"
      />
      <div className="absolute inset-0 bg-[#E8F6FF]/88" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#4FD8FF]/30 via-[#EAF7FF]/20 to-[#5CFFD8]/25" />
    </div>
  );
}

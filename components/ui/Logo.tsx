import Image from "next/image";
import { officialLogo } from "@/lib/brand-assets";

type LogoProps = {
  /** Kept so existing call sites compile. Every slot is the official lockup. */
  variant?: "mark" | "lockup" | "badge";
  /** Rendered height in pixels. Width follows the artwork. */
  height?: number;
  /** Ignored. The official logo is never swapped for a light-text variant. */
  tone?: "auto" | "dark" | "light";
  suffix?: string;
  className?: string;
  priority?: boolean;
};

export function Logo({ height = 48, suffix, className = "", priority = false }: LogoProps) {
  const width = Math.max(1, Math.round((height * officialLogo.width) / officialLogo.height));

  return (
    <span className={`inline-flex items-center gap-2 align-middle ${className}`}>
      <Image
        src={officialLogo.src}
        alt="SheRides"
        width={officialLogo.width}
        height={officialLogo.height}
        priority={priority}
        sizes={`${width * 2}px`}
        className="brand-logo block max-w-full shrink-0 object-contain"
        style={{ height, width, filter: "none" }}
      />
      {suffix ? <span className="font-label-lg text-label-lg tracking-normal text-current">{suffix}</span> : null}
    </span>
  );
}

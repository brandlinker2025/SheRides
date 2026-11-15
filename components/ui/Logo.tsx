import Image from "next/image";
import { brandAssets, type LogoVariant } from "@/lib/brand-assets";

type LogoProps = {
  /** mark = no tagline (headers). lockup = illustration + tagline (hero, auth, splash). badge = circular icon. */
  variant?: LogoVariant;
  /** Rendered height in pixels. Width follows the artwork so the box cannot shift. */
  height?: number;
  /** dark/light forces the artwork. auto follows data-theme, for surfaces that actually change color. */
  tone?: "auto" | "dark" | "light";
  suffix?: string;
  className?: string;
  priority?: boolean;
};

export function Logo({ variant = "mark", height = 48, tone = "dark", suffix, className = "", priority = false }: LogoProps) {
  const asset = brandAssets[variant];
  const width = Math.max(1, Math.round(height * asset.ratio));
  const sizes = `${width * 2}px`;
  const frame = "absolute inset-0 h-full w-full object-contain";
  const imageProps = { quality: 95 as const, priority };

  return (
    <span className={`inline-flex items-center gap-2 align-middle ${className}`}>
      <span
        className="relative block max-w-full shrink-0"
        style={{ width, aspectRatio: `${asset.dark.width} / ${asset.dark.height}` }}
      >
        {tone !== "light" ? (
          <Image
            src={asset.dark.src}
            alt="SheRides"
            width={asset.dark.width}
            height={asset.dark.height}
            sizes={sizes}
            {...imageProps}
            className={tone === "auto" ? `brand-logo-dark ${frame}` : frame}
          />
        ) : null}
        {tone !== "dark" ? (
          <Image
            src={asset.light.src}
            alt="SheRides"
            width={asset.light.width}
            height={asset.light.height}
            sizes={sizes}
            {...imageProps}
            className={tone === "auto" ? `brand-logo-light ${frame}` : frame}
          />
        ) : null}
      </span>
      {suffix ? (
        <span className="font-label-lg text-label-lg tracking-normal text-current">{suffix}</span>
      ) : null}
    </span>
  );
}

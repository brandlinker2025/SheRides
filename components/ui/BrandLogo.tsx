import { Logo } from "./Logo";

type BrandLogoProps = {
  className?: string;
  suffix?: string;
  /** mark in headers, lockup on splash and auth, badge for tiny chrome. */
  variant?: "mark" | "lockup" | "badge";
  height?: number;
  priority?: boolean;
};

/** Shared SheRides artwork. Prefer `Logo` at new call sites. */
export function BrandLogo({ className = "", suffix, variant = "mark", height = 48, priority = false }: BrandLogoProps) {
  return <Logo variant={variant} height={height} suffix={suffix} priority={priority} className={className} />;
}

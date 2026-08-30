import type { CSSProperties } from "react";

type BrandLogoProps = {
  className?: string;
  suffix?: string;
};

const initialStyle: CSSProperties = {
  fontFamily: "var(--font-butterpop), Georgia, serif",
  fontStyle: "normal",
  fontWeight: 400,
};

export function BrandLogo({ className = "", suffix }: BrandLogoProps) {
  return (
    <span
      aria-label={suffix ? `SheRides ${suffix}` : "SheRides"}
      className={`inline-flex items-baseline whitespace-nowrap font-display-lg font-bold leading-none tracking-[-0.04em] text-accent-magenta ${className}`}
    >
      <span aria-hidden="true" style={initialStyle}>S</span>
      <span aria-hidden="true">he</span>
      <span aria-hidden="true" style={initialStyle}>R</span>
      <span aria-hidden="true">ides</span>
      {suffix && (
        <span aria-hidden="true" className="ml-2 font-label-lg not-italic tracking-normal">
          {suffix}
        </span>
      )}
    </span>
  );
}

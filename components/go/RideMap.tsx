"use client";

import { useMemo } from "react";
import type { GoPlace } from "@/lib/go";

type Pin = { place: GoPlace; kind: "pickup" | "drop" };

function project(place: GoPlace, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.01);
  const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.01);
  const x = ((place.lng - bounds.minLng) / lngSpan) * 76 + 12;
  const y = (1 - (place.lat - bounds.minLat) / latSpan) * 70 + 12;
  return { x, y };
}

/** Stylized live-map frame. Pins track pickup and drop without a third-party map key. */
export function RideMap({ pickup, drop }: { pickup: GoPlace | null; drop: GoPlace | null }) {
  const pins = useMemo(() => [pickup && { place: pickup, kind: "pickup" as const }, drop && { place: drop, kind: "drop" as const }].filter(Boolean) as Pin[], [pickup, drop]);
  const bounds = useMemo(() => {
    const points = pins.length ? pins.map((pin) => pin.place) : [{ lat: 23.78, lng: 90.36 }, { lat: 23.86, lng: 90.44 }];
    const lats = points.map((point) => point.lat);
    const lngs = points.map((point) => point.lng);
    const padLat = Math.max((Math.max(...lats) - Math.min(...lats)) * 0.35, 0.012);
    const padLng = Math.max((Math.max(...lngs) - Math.min(...lngs)) * 0.35, 0.012);
    return {
      minLat: Math.min(...lats) - padLat,
      maxLat: Math.max(...lats) + padLat,
      minLng: Math.min(...lngs) - padLng,
      maxLng: Math.max(...lngs) + padLng,
    };
  }, [pins]);
  const placed = pins.map((pin) => ({ ...pin, ...project(pin.place, bounds) }));

  return (
    <div className="relative h-full min-h-[220px] overflow-hidden rounded-[28px] border border-[#e7dafa] bg-[#f0e9ff] shadow-[0_20px_50px_-24px_rgba(97,53,188,0.45)]">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(134,81,220,0.22), transparent 34%), radial-gradient(circle at 80% 70%, rgba(80,212,189,0.28), transparent 38%), linear-gradient(160deg, #f7f2ff 0%, #ece2ff 55%, #e3f8f3 100%)",
        }}
      />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <line key={`h-${index}`} x1="0" x2="100" y1={8 + index * 12} y2={4 + index * 12} stroke="rgba(97,53,188,0.08)" strokeWidth="0.35" />
        ))}
        {Array.from({ length: 7 }, (_, index) => (
          <line key={`v-${index}`} y1="0" y2="100" x1={6 + index * 14} x2={10 + index * 13} stroke="rgba(97,53,188,0.07)" strokeWidth="0.35" />
        ))}
        <path d="M8 72 C 24 68, 30 40, 48 46 S 70 78, 94 30" fill="none" stroke="rgba(134,81,220,0.45)" strokeWidth="1.4" />
        <path d="M4 28 C 22 36, 40 18, 58 32 S 78 20, 98 48" fill="none" stroke="rgba(80,212,189,0.6)" strokeWidth="1.1" />
        <path d="M12 90 C 30 60, 46 84, 70 58 S 86 40, 96 62" fill="none" stroke="rgba(97,53,188,0.18)" strokeWidth="0.7" />
        {placed.length === 2 && (
          <line
            x1={placed[0].x}
            y1={placed[0].y}
            x2={placed[1].x}
            y2={placed[1].y}
            stroke="url(#route)"
            strokeWidth="0.9"
            strokeDasharray="1.6 1.1"
          />
        )}
        <defs>
          <linearGradient id="route" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#50d4bd" />
            <stop offset="100%" stopColor="#6135bc" />
          </linearGradient>
        </defs>
      </svg>
      {placed.map((pin) => (
        <span
          key={pin.kind}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        >
          <span
            className={`block h-3.5 w-3.5 rounded-full border-2 border-white shadow-lg ${pin.kind === "pickup" ? "bg-cyan-300" : "bg-violet-400"}`}
          />
          <span className="mt-1 block max-w-[140px] truncate rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
            {pin.kind === "pickup" ? "Pickup" : "Drop-off"}
          </span>
        </span>
      ))}
      <div className="absolute left-3 top-3 flex max-w-[70%] items-center gap-2 rounded-full border border-[#e7dafa] bg-[#fffcff]/90 px-3 py-1.5 text-[#261c38] shadow-lg backdrop-blur-md">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#50d4bd]" />
        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-[#6135bc]">100% female captains · checked by an admin</span>
      </div>
      <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-[#e7dafa] bg-[#fffcff]/92 px-4 py-3 text-[#261c38] shadow-lg backdrop-blur-xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6135bc]">Live map</p>
        <p className="mt-1 truncate text-sm font-semibold">{pickup?.label ?? "Pickup not set"}</p>
        <p className="truncate text-sm text-[#5d5170]">{drop ? drop.label : "Choose a destination"}</p>
      </div>
      {!pins.length && (
        <p className="absolute left-4 top-4 rounded-full bg-[#fffcff]/90 px-3 py-1 text-xs font-semibold text-[#422a6c] backdrop-blur-md">
          Dhaka · waiting for a route
        </p>
      )}
    </div>
  );
}

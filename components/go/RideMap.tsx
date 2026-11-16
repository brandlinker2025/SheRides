"use client";

import dynamic from "next/dynamic";
import type { RideMapProps } from "./ride-map-types";

function RideMapLoading() {
  return (
    <section
      aria-label="Ride map"
      data-testid="ride-map"
      data-map-state="loading"
      className="ride-map relative h-full min-h-[220px] overflow-hidden rounded-[28px] border border-[#460377]/15 bg-[#F4FBFF]"
    >
      <p className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#460377] shadow">Loading map</p>
    </section>
  );
}

const RideMapCanvas = dynamic(() => import("./RideMapCanvas"), {
  ssr: false,
  loading: RideMapLoading,
});

export function RideMap(props: RideMapProps) {
  return <RideMapCanvas {...props} />;
}

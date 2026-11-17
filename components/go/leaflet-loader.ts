"use client";

import type * as Leaflet from "leaflet";

/** Loads Leaflet only when a map is actually shown, so the booking page stays light. */
export async function loadLeaflet(): Promise<typeof Leaflet> {
  const mod = await import("leaflet");
  return (mod.default ?? mod) as typeof Leaflet;
}

export const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
export const DHAKA = { lat: 23.78, lng: 90.4 };

export function pinIcon(L: typeof Leaflet, kind: "pickup" | "drop" | "rider") {
  return L.divIcon({ className: `sr-pin sr-pin-${kind}`, html: "<span></span>", iconSize: [26, 26], iconAnchor: [13, 13] });
}

"use client";

import type * as Leaflet from "leaflet";

/** Loads Leaflet only when a map is actually shown, so the booking page stays light. */
export async function loadLeaflet(): Promise<typeof Leaflet> {
  const mod = await import("leaflet");
  return (mod.default ?? mod) as typeof Leaflet;
}

/** Street map (Esri World Street Map) and satellite photos (Esri World Imagery). Neither needs an API key. */
export const MAP_LAYERS = {
  street: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Map &copy; Esri, HERE, Garmin, OpenStreetMap contributors",
    subdomains: "",
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
    subdomains: "",
    maxZoom: 19,
  },
} as const;

export type MapLayer = keyof typeof MAP_LAYERS;

export function tileLayer(L: typeof Leaflet, layer: MapLayer) {
  const cfg = MAP_LAYERS[layer];
  return L.tileLayer(cfg.url, {
    attribution: cfg.attribution,
    maxZoom: cfg.maxZoom,
    ...(cfg.subdomains ? { subdomains: cfg.subdomains } : {}),
  });
}

export const DHAKA = { lat: 23.78, lng: 90.4 };

export function pinIcon(L: typeof Leaflet, kind: "pickup" | "drop" | "rider") {
  return L.divIcon({ className: `sr-pin sr-pin-${kind}`, html: "<span></span>", iconSize: [26, 26], iconAnchor: [13, 13] });
}

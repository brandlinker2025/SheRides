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

/** Modern vector map (OpenFreeMap "liberty", OpenStreetMap data, no API key). */
const VECTOR_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const VECTOR_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Base map for a Leaflet map: the modern vector style for "street" (loaded only when a map is shown),
 * Esri photos for "satellite". Phones without WebGL fall back to the Esri street tiles.
 */
export async function baseLayer(L: typeof Leaflet, layer: MapLayer): Promise<Leaflet.Layer> {
  if (layer === "street" && hasWebGL()) {
    try {
      const maplibre = await import("maplibre-gl");
      // MapLibre 6 runs in a module worker; serve it from our own origin (public/vendor) so the bundler's chunk names do not matter.
      (maplibre as unknown as { setWorkerUrl?: (url: string) => void }).setWorkerUrl?.("/vendor/maplibre-gl-worker-6.19.0.mjs");
      (window as unknown as { maplibregl: unknown }).maplibregl = (maplibre as unknown as { default?: unknown }).default ?? maplibre;
      const plugin = (await import("@maplibre/maplibre-gl-leaflet")) as unknown as {
        maplibreGL: (options: Record<string, unknown>) => Leaflet.Layer;
      };
      return plugin.maplibreGL({ style: VECTOR_STYLE, attribution: VECTOR_ATTRIBUTION, interactive: false });
    } catch {
      /* fall back to raster tiles */
    }
  }
  return tileLayer(L, layer);
}

export function pinIcon(L: typeof Leaflet, kind: "pickup" | "drop" | "rider") {
  return L.divIcon({ className: `sr-pin sr-pin-${kind}`, html: "<span></span>", iconSize: [26, 26], iconAnchor: [13, 13] });
}

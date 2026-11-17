"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import type { GoPlace } from "@/lib/go";
import { DHAKA, OSM_ATTRIBUTION, OSM_TILES, loadLeaflet, pinIcon } from "./leaflet-loader";

/** Real street map for an active ride: pickup, drop-off and the captain's live position. */
export function RideMap({ pickup, drop, rider = null }: { pickup: GoPlace | null; drop: GoPlace | null; rider?: GoPlace | null }) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const layerRef = useRef<Leaflet.LayerGroup | null>(null);
  const libRef = useRef<typeof Leaflet | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadLeaflet().then((L) => {
      if (cancelled || !box.current) return;
      libRef.current = L;
      const map = L.map(box.current, { zoomControl: false, attributionControl: true }).setView([DHAKA.lat, DHAKA.lng], 12);
      L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = libRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !map || !layer) return;
    layer.clearLayers();
    const points: [number, number][] = [];
    const add = (place: GoPlace | null, kind: "pickup" | "drop" | "rider", label: string) => {
      if (!place) return;
      L.marker([place.lat, place.lng], { icon: pinIcon(L, kind), title: label }).bindTooltip(label).addTo(layer);
      points.push([place.lat, place.lng]);
    };
    add(pickup, "pickup", "Pickup");
    add(drop, "drop", "Drop-off");
    add(rider, "rider", "Captain");
    if (pickup && drop) {
      L.polyline([[pickup.lat, pickup.lng], [drop.lat, drop.lng]], { color: "#7244f2", weight: 4, opacity: 0.7, dashArray: "8 8" }).addTo(layer);
    }
    if (points.length === 1) map.setView(points[0], 16);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 16 });
  }, [ready, pickup, drop, rider]);

  return (
    <div className="relative h-full min-h-[220px] overflow-hidden rounded-[28px] border border-[#e4d8ff] bg-[#efe7ff] shadow-[0_20px_50px_-24px_rgba(112,68,245,0.45)]">
      <div ref={box} className="absolute inset-0" />
      {!ready && <p className="absolute inset-0 grid place-items-center text-sm text-[#5e5276]">Map লোড হচ্ছে…</p>}
      <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-full border border-[#e4d8ff] bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#7044f5] shadow">
        <span className="h-2 w-2 rounded-full bg-[#3fd0c1]" /> Live map
      </div>
    </div>
  );
}

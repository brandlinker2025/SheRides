"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { Icon } from "@/components/ui/Icon";
import { reversePlace, type GoPlace } from "@/lib/go";
import { DHAKA, OSM_ATTRIBUTION, OSM_TILES, loadLeaflet } from "./leaflet-loader";

/** Full-screen "choose on map": move the map under the centre pin, then confirm. */
export function MapPicker({ start, title, onPick, onClose }: { start: GoPlace | null; title: string; onPick: (place: GoPlace) => void; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadLeaflet().then((L) => {
      if (cancelled || !box.current) return;
      const c = start ?? DHAKA;
      const map = L.map(box.current, { zoomControl: false, attributionControl: true }).setView([c.lat, c.lng], start ? 16 : 13);
      L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [start]);

  async function confirm() {
    const map = mapRef.current;
    if (!map) return;
    setBusy(true);
    const { lat, lng } = map.getCenter();
    const label = await reversePlace(lat, lng);
    setBusy(false);
    onPick({ label, lat, lng });
  }

  function locateMe() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 17),
      () => undefined,
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#efe7ff]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex items-center gap-2 bg-white px-3 py-3 shadow">
        <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-[#e9dfff] text-[#4a2e8a]" aria-label="Close map">
          <Icon name="arrow_back" />
        </button>
        <p className="flex-1 text-base font-bold text-[#251b3a]">{title}</p>
      </div>
      <div className="relative flex-1">
        <div ref={box} className="absolute inset-0" />
        {!ready && <p className="absolute inset-0 grid place-items-center text-sm text-[#5e5276]">Map লোড হচ্ছে…</p>}
        <span className="sr-pin sr-pin-drop sr-pin-center pointer-events-none" aria-hidden="true"><span /></span>
        <button type="button" onClick={locateMe} className="absolute left-3 top-3 z-[500] inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-bold text-[#4a2e8a] shadow">
          <Icon name="my_location" size={18} /> আমার location
        </button>
      </div>
      <div className="bg-white p-4 shadow-[0_-8px_24px_-12px_#7244f266]">
        <p className="mb-2 text-center text-sm text-[#5e5276]">ম্যাপ সরিয়ে পিনটা ঠিক জায়গায় আনুন</p>
        <button type="button" disabled={!ready || busy} onClick={() => void confirm()} className="btn btn-primary h-14 w-full text-lg">
          {busy ? "নিশ্চিত হচ্ছে…" : "এই জায়গা বেছে নিন"}
        </button>
      </div>
    </div>
  );
}

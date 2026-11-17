"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type * as Leaflet from "leaflet";
import { Icon } from "@/components/ui/Icon";
import { reversePlace, searchPlaces, type GoPlace } from "@/lib/go";
import { DHAKA, loadLeaflet, tileLayer, type MapLayer } from "./leaflet-loader";

/**
 * Full-screen "choose on map". Rendered into <body> so it always covers the whole screen
 * (cards with blur effects would otherwise trap it in a small box).
 */
export function MapPicker({ start, title, onPick, onClose }: { start: GoPlace | null; title: string; onPick: (place: GoPlace) => void; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const libRef = useRef<typeof Leaflet | null>(null);
  const tilesRef = useRef<Leaflet.TileLayer | null>(null);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [layer, setLayer] = useState<MapLayer>("street");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoPlace[]>([]);
  const [centerLabel, setCenterLabel] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    void loadLeaflet().then((L) => {
      if (cancelled || !box.current) return;
      libRef.current = L;
      const c = start ?? DHAKA;
      const map = L.map(box.current, { zoomControl: false, attributionControl: true }).setView([c.lat, c.lng], start ? 17 : 13);
      tilesRef.current = tileLayer(L, "street").addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      let timer: number | undefined;
      map.on("moveend", () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          const { lat, lng } = map.getCenter();
          void reversePlace(lat, lng).then(setCenterLabel);
        }, 500);
      });
      mapRef.current = map;
      setReady(true);
      window.setTimeout(() => map.invalidateSize(), 50);
      map.fire("moveend");
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mounted, start]);

  useEffect(() => {
    const L = libRef.current;
    const map = mapRef.current;
    if (!L || !map || !ready) return;
    tilesRef.current?.remove();
    tilesRef.current = tileLayer(L, layer).addTo(map);
  }, [layer, ready]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const c = mapRef.current?.getCenter();
      void searchPlaces(query, controller.signal, c ? { lat: c.lat, lng: c.lng } : null).then(setResults).catch(() => undefined);
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  async function confirm() {
    const map = mapRef.current;
    if (!map) return;
    setBusy(true);
    const { lat, lng } = map.getCenter();
    const label = centerLabel || (await reversePlace(lat, lng));
    setBusy(false);
    onPick({ label, lat, lng });
  }

  function locateMe() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 18),
      () => undefined,
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (!mounted) return null;
  return createPortal(
    <div className="sr-mappicker" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sr-mappicker-top">
        <button type="button" onClick={onClose} className="sr-mappicker-icon" aria-label="Close map">
          <Icon name="arrow_back" />
        </button>
        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-2 rounded-full bg-[#f3eeff] px-4">
            <Icon name="search" size={20} className="text-[#7044f5]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="জায়গা বা রাস্তা খুঁজুন"
              aria-label="Search on map"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[#251b3a] outline-none placeholder:text-[#8a7d9e]"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear"><Icon name="close" size={18} className="text-[#5e5276]" /></button>
            )}
          </div>
          {results.length > 0 && (
            <ul className="sr-mappicker-results">
              {results.map((place) => (
                <li key={`${place.lat},${place.lng}`}>
                  <button
                    type="button"
                    onClick={() => {
                      mapRef.current?.flyTo([place.lat, place.lng], 18);
                      setQuery("");
                      setResults([]);
                    }}
                    className="flex w-full items-start gap-2 px-4 py-3 text-left text-sm hover:bg-[#f3eeff]"
                  >
                    <Icon name="location_on" size={18} className="mt-0.5 text-[#7044f5]" />
                    <span>{place.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="relative flex-1">
        <div ref={box} className="absolute inset-0" />
        {!ready && <p className="absolute inset-0 grid place-items-center text-sm text-[#5e5276]">Map লোড হচ্ছে…</p>}
        <span className="sr-pin sr-pin-drop sr-pin-center pointer-events-none" aria-hidden="true"><span /></span>
        <div className="absolute left-3 top-3 z-[500] flex flex-col gap-2">
          <button type="button" onClick={locateMe} className="sr-map-chip">
            <Icon name="my_location" size={18} /> আমার location
          </button>
          <div className="sr-map-chip p-1">
            {(["street", "satellite"] as MapLayer[]).map((l) => (
              <button key={l} type="button" onClick={() => setLayer(l)} className={`rounded-full px-3 py-1 text-xs font-bold ${layer === l ? "bg-[#7044f5] text-white" : "text-[#4a2e8a]"}`}>
                {l === "street" ? "Map" : "Satellite"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sr-mappicker-bottom">
        <p className="mb-1 flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-[#251b3a]">
          <Icon name="location_on" size={18} className="text-[#7244f2]" />
          <span className="truncate">{centerLabel || "ম্যাপ সরিয়ে পিনটা ঠিক জায়গায় আনুন"}</span>
        </p>
        <p className="mb-3 text-center text-xs text-[#5e5276]">ম্যাপ টেনে পিনটা গেটের ঠিক উপর আনুন · জুম করতে দুই আঙুল</p>
        <button type="button" disabled={!ready || busy} onClick={() => void confirm()} className="btn btn-primary h-14 w-full text-lg">
          {busy ? "নিশ্চিত হচ্ছে…" : "এই জায়গা বেছে নিন"}
        </button>
      </div>
    </div>,
    document.body,
  );
}

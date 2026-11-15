"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { locationErrorMessage, requestRiderLocation } from "@/lib/geolocation";
import { reversePlace, searchPlaces, type GoPlace } from "@/lib/go";

type Props = {
  label: string;
  icon: string;
  value: GoPlace | null;
  onChange: (place: GoPlace | null) => void;
  allowCurrentLocation?: boolean;
  /** Read GPS once when the field is still empty. */
  autoLocate?: boolean;
  placeholder?: string;
};

export function PlaceInput({ label, icon, value, onChange, allowCurrentLocation, autoLocate, placeholder }: Props) {
  const [text, setText] = useState(value?.label ?? "");
  const [results, setResults] = useState<GoPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const located = useRef(false);
  const skipSearch = useRef(false);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }
    if (value && value.label === text) return;
    if (text.trim().length < 3) {
      setResults([]);
      return;
    }
    // Nominatim asks for at most 1 request a second: wait for typing to pause.
    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      void searchPlaces(text, controller.signal)
        .then((rows) => {
          setResults(rows);
          setOpen(true);
        })
        .catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [text, value]);

  useEffect(() => {
    if (!autoLocate || located.current || value) return;
    located.current = true;
    void fillMyLocation(false);
    // Run once on mount. fillMyLocation is stable enough for a single GPS read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLocate]);

  async function fillMyLocation(manual = true) {
    setBusy(true);
    setNote(null);
    try {
      const position = await requestRiderLocation();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const name = await reversePlace(lat, lng);
      const place = { label: name, lat, lng };
      skipSearch.current = true;
      setText(name);
      onChange(place);
      setOpen(false);
    } catch (err) {
      setNote(manual ? locationErrorMessage(err) : "Location is off. Type a pickup, or tap to try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <span className="mb-1.5 block text-sm font-semibold text-white/70">{label}</span>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#1A1A24]/80 px-3 focus-within:border-[#A855F7] focus-within:ring-2 focus-within:ring-[#A855F7]/30">
        <Icon name={icon} className="text-[#ddb7ff]" />
        <input
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (value) onChange(null);
          }}
          onFocus={() => results.length && setOpen(true)}
          placeholder={busy ? "Finding your location…" : placeholder ?? "Type an area, road or place"}
          className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#e4e1e9] placeholder:text-white/35 focus:outline-none"
        />
        {value ? <Icon name="check_circle" filled className="text-green-600" size={20} /> : null}
      </div>
      {allowCurrentLocation && (
        <button
          type="button"
          onClick={() => void fillMyLocation()}
          disabled={busy}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ddb7ff] disabled:opacity-60"
        >
          <Icon name="my_location" size={18} />
          {busy ? "Finding you…" : "Use my current location"}
        </button>
      )}
      {note && <p className="mt-1 font-body-sm text-error">{note}</p>}
      {open && results.length > 0 && !value && (
        <ul className="z-30 mt-1 max-h-60 w-full overflow-y-auto overflow-hidden card-surface">
          {results.map((place) => (
            <li key={`${place.lat},${place.lng}`}>
              <button
                type="button"
                onClick={() => {
                  setText(place.label);
                  onChange(place);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-3 font-body-sm hover:bg-accent-magenta/10 flex gap-2 items-start"
              >
                <Icon name="location_on" size={18} className="text-accent-magenta mt-0.5" />
                <span>{place.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && text.trim().length >= 3 && results.length === 0 && !value && (
        <p className="mt-1 font-body-sm text-tertiary">No match yet — try a nearby landmark or road name.</p>
      )}
    </div>
  );
}

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
};

export function PlaceInput({ label, icon, value, onChange, allowCurrentLocation }: Props) {
  const [text, setText] = useState(value?.label ?? "");
  const [results, setResults] = useState<GoPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
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

  async function fillMyLocation() {
    setBusy(true);
    setNote(null);
    try {
      const position = await requestRiderLocation();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const name = await reversePlace(lat, lng);
      const place = { label: name, lat, lng };
      setText(name);
      onChange(place);
      setOpen(false);
    } catch (err) {
      setNote(locationErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <span className="mb-1.5 block font-label-lg text-secondary">{label}</span>
      <div className="flex items-center gap-2 bg-soft-off-white border border-surface-border rounded-xl px-3 focus-within:border-accent-magenta focus-within:ring-2 focus-within:ring-accent-magenta/20">
        <Icon name={icon} className="text-accent-magenta" />
        <input
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (value) onChange(null);
          }}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Type an area, road or place"
          className="flex-1 bg-transparent py-3 font-body-md focus:outline-none min-w-0"
        />
        {value ? <Icon name="check_circle" filled className="text-green-600" size={20} /> : null}
      </div>
      {allowCurrentLocation && (
        <button
          type="button"
          onClick={() => void fillMyLocation()}
          disabled={busy}
          className="mt-2 inline-flex items-center gap-1.5 font-label-lg text-accent-magenta text-sm disabled:opacity-60"
        >
          <Icon name="my_location" size={18} />
          {busy ? "Finding you…" : "Use my current location"}
        </button>
      )}
      {note && <p className="mt-1 font-body-sm text-error">{note}</p>}
      {open && results.length > 0 && !value && (
        <ul className="absolute z-30 mt-1 w-full card-surface overflow-hidden max-h-72 overflow-y-auto">
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

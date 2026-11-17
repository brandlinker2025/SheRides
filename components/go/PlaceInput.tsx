"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { locationErrorMessage, requestRiderLocation } from "@/lib/geolocation";
import { reversePlace, searchPlaces, type GoPlace } from "@/lib/go";
import { MapPicker } from "./MapPicker";

type Props = {
  label: string;
  icon: string;
  value: GoPlace | null;
  onChange: (place: GoPlace | null) => void;
  allowCurrentLocation?: boolean;
  /** Read GPS once when the field is still empty. */
  autoLocate?: boolean;
  placeholder?: string;
  /** Search results near this point come first (usually the pickup). */
  near?: GoPlace | null;
  /** Show "Choose on map". */
  allowMapPick?: boolean;
};

export function PlaceInput({ label, icon, value, onChange, allowCurrentLocation, autoLocate, placeholder, near, allowMapPick = true }: Props) {
  const [text, setText] = useState(value?.label ?? "");
  const [results, setResults] = useState<GoPlace[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const located = useRef(false);
  const skipSearch = useRef(false);

  useEffect(() => {
    if (skipSearch.current) {
      skipSearch.current = false;
      return;
    }
    if (value && value.label === text) return;
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    // Wait for typing to pause, then search (Photon first, Nominatim as fallback).
    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSearching(true);
      void searchPlaces(text, controller.signal, near)
        .then((rows) => {
          setResults(rows);
          setOpen(true);
          setSearching(false);
        })
        .catch((err) => {
          if ((err as Error)?.name !== "AbortError") {
            setResults([]);
            setOpen(true);
            setSearching(false);
          }
        });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [text, value, near]);

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
      <span className="mb-1.5 block text-sm font-semibold text-[#5e5276]">{label}</span>
      <div className="flex items-center gap-2 rounded-full border border-[#e4d8ff] bg-[#f8f4ff] px-3 focus-within:border-[#9466f6] focus-within:ring-2 focus-within:ring-[#9466f6]/30">
        <Icon name={icon} className="text-[#7044f5]" />
        <input
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (value) onChange(null);
          }}
          onFocus={() => results.length && setOpen(true)}
          placeholder={busy ? "Finding your location…" : placeholder ?? "Type an area, road or place"}
          className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#251b3a] placeholder:text-[#8a7d9e] focus:outline-none"
          enterKeyHint="search"
          autoComplete="off"
        />
        {searching && !value ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#c9b6f7] border-t-[#7044f5]" aria-label="Searching" /> : null}
        {value ? <Icon name="check_circle" filled className="text-[#24afa2]" size={20} /> : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {allowCurrentLocation && (
          <button
            type="button"
            onClick={() => void fillMyLocation()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7044f5] disabled:opacity-60"
          >
            <Icon name="my_location" size={18} />
            {busy ? "Finding you…" : "Use my current location"}
          </button>
        )}
        {allowMapPick && (
          <button type="button" onClick={() => setMapOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7044f5]">
            <Icon name="location_on" size={18} /> ম্যাপে বেছে নিন
          </button>
        )}
      </div>
      {mapOpen && (
        <MapPicker
          title={label}
          start={value ?? near ?? null}
          onClose={() => setMapOpen(false)}
          onPick={(place) => {
            skipSearch.current = true;
            setText(place.label);
            onChange(place);
            setOpen(false);
            setMapOpen(false);
          }}
        />
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
      {open && !searching && text.trim().length >= 2 && results.length === 0 && !value && (
        <p className="mt-1 font-body-sm text-tertiary">মিলছে না — কাছের কোনো landmark বা রাস্তার নাম লিখুন, অথবা <b>ম্যাপে বেছে নিন</b>।</p>
      )}
    </div>
  );
}

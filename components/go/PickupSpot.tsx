"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const LANDMARKS = [
  "Main Security Gate 1",
  "Opposite Agora Superstore",
  "Behind Westin Lobby Side",
  "Near Foot Overbridge",
  "Pharmacy Corner",
];

const SPOTS = [
  { id: "guard", title: "Guard Booth", detail: "24/7 Security", icon: "local_police" },
  { id: "shed", title: "Sheltered Shed", detail: "Rain Protected", icon: "roofing" },
  { id: "lobby", title: "Lobby Arcade", detail: "CCTV Monitored", icon: "videocam" },
];

const QUICK_NOTES = [
  "Waiting inside lobby until arrival",
  "Small backpack only",
  "Sanitized hairnet requested",
  "Quiet ride preference",
];

type PickupSpotProps = {
  pickupLabel: string;
  onNote: (note: string) => void;
};

/** Exact pickup details. A photo stays on the phone because there is no upload store yet. */
export function PickupSpot({ pickupLabel, onNote }: PickupSpotProps) {
  const [open, setOpen] = useState(true);
  const [landmark, setLandmark] = useState<string | null>(null);
  const [spot, setSpot] = useState<string | null>(null);
  const [quick, setQuick] = useState<string[]>([]);
  const [written, setWritten] = useState("");
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [attached, setAttached] = useState(false);

  const note = useMemo(() => {
    const waiting = SPOTS.find((item) => item.id === spot)?.title;
    const parts = [
      landmark ? `Gate/landmark: ${landmark}` : "",
      waiting ? `Waiting spot: ${waiting}` : "",
      ...quick,
      written.trim(),
      photoName ? "Gate photo taken on this phone (not uploaded)" : "",
    ].filter(Boolean);
    return parts.join(" · ").slice(0, 300);
  }, [landmark, spot, quick, written, photoName]);

  useEffect(() => {
    onNote(attached ? note : "");
  }, [attached, note, onNote]);

  return (
    <section className="rounded-[28px] border border-[var(--sr-line)] bg-[var(--sr-card)] p-4 text-[var(--sr-ink)] shadow-[var(--sr-shadow)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--sr-heading)]">Precision pickup</p>
          <h2 className="text-lg font-bold">Specify Exact Pickup Spot</h2>
          <p className="mt-1 text-sm text-[var(--sr-muted)]">Helps your female captain locate you safely without calls.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--sr-chip)] text-[var(--sr-muted)]" aria-expanded={open} aria-label={open ? "Hide pickup spot" : "Show pickup spot"}>
          <Icon name={open ? "close" : "expand_more"} size={18} />
        </button>
      </div>
      {open && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--sr-chip)] p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--sr-inset)] text-[var(--sr-heading)]">
              <Icon name="location_on" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{pickupLabel}</span>
              <span className="block text-xs text-[var(--sr-muted)]">Your pinned pickup. Landmarks below are notes, not a new address.</span>
            </span>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Popular Dhaka Landmarks Nearby</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--sr-faint)]">Tap to attach</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {LANDMARKS.map((item) => {
                const selected = landmark === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLandmark(item)}
                    className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ${
                      selected ? "bg-[#460377]/10 text-[var(--sr-heading)]" : "bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] text-[var(--sr-muted)]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-semibold">Waiting Spot Security Profile</span>
            <div className="grid grid-cols-3 gap-2">
              {SPOTS.map((item) => {
                const selected = spot === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSpot(item.id)}
                    className={`rounded-2xl p-2.5 text-center ${selected ? "bg-[#460377]/10 text-[var(--sr-ink)]" : "bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] text-[var(--sr-muted)]"}`}
                  >
                    <Icon name={item.icon} className={selected ? "text-[var(--sr-heading)]" : "text-[var(--sr-muted)]"} />
                    <span className="mt-1 block text-xs font-bold">{item.title}</span>
                    <span className="block text-[10px] text-[var(--sr-gold-ink)]">{item.detail}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-[var(--sr-line)] bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] p-3">
            <div className="flex items-center gap-2">
              <Icon name="add_a_photo" className="text-[var(--sr-gold-ink)]" />
              <div>
                <p className="text-sm font-semibold">Landmark / Waiting Spot Photo</p>
                <p className="text-xs text-[var(--sr-muted)]">Optional • Fast spotting</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--sr-muted)]">
              Not uploaded. SheRides has no pickup-photo store yet, so this picture stays on your phone and is not sent to a captain.
            </p>
            <label className="mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[var(--sr-chip)] px-4 text-sm font-semibold">
              <Icon name="photo_camera_back" size={18} />
              {photoName ? "Replace photo" : "+ Take or upload gate photo"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setPhotoName(file ? file.name : null);
                }}
              />
            </label>
            {photoName && (
              <p className="mt-2 text-xs text-[var(--sr-muted)]">
                {photoName} · on this device only
                <button type="button" className="ml-2 font-semibold text-[var(--sr-heading)]" onClick={() => setPhotoName(null)}>
                  Remove
                </button>
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Special Pickup Note for Captain</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--sr-faint)]">Optional</span>
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              {QUICK_NOTES.map((item) => {
                const selected = quick.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuick((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]))}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selected ? "bg-[#460377]/10 text-[var(--sr-heading)]" : "bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] text-[var(--sr-muted)]"}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            <textarea
              value={written}
              onChange={(event) => setWritten(event.target.value)}
              maxLength={180}
              rows={2}
              placeholder="Note for your captain (gate, scarf colour)"
              className="w-full rounded-2xl border border-[var(--sr-line)] bg-[var(--sr-inset)] px-4 py-3 text-sm text-[var(--sr-ink)] placeholder:text-[var(--sr-faint)]"
            />
          </div>

          <p className="flex items-start gap-2 text-xs text-[var(--sr-muted)]">
            <Icon name="shield_with_heart" className="shrink-0 text-[var(--sr-gold-ink)]" size={18} />
            Sanctuary Arrival Promise. Captain waits up to 3 mins complimentary inside this safe perimeter. A camera check is not recorded in the app.
          </p>
          <button
            type="button"
            onClick={() => {
              setAttached(true);
              setOpen(false);
            }}
            className="h-12 rounded-full bg-[#FF6772] text-sm font-semibold text-[#460377]"
          >
            Confirm Pickup Spot
          </button>
        </div>
      )}
    </section>
  );
}

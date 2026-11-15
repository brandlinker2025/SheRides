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
    <section className="rounded-[28px] border border-white/10 bg-[#121217]/90 p-4 text-[#e4e1e9] shadow-[0_8px_32px_-4px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ddb7ff]">Precision pickup</p>
          <h2 className="text-lg font-bold">Specify Exact Pickup Spot</h2>
          <p className="mt-1 text-sm text-white/70">Helps your female captain locate you safely without calls.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a292f] text-white/70" aria-expanded={open} aria-label={open ? "Hide pickup spot" : "Show pickup spot"}>
          <Icon name={open ? "close" : "expand_more"} size={18} />
        </button>
      </div>
      {open && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-[#2a292f] p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0e0e13] text-[#ddb7ff]">
              <Icon name="location_on" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{pickupLabel}</span>
              <span className="block text-xs text-white/60">Your pinned pickup. Landmarks below are notes, not a new address.</span>
            </span>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Popular Dhaka Landmarks Nearby</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">Tap to attach</span>
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
                      selected ? "bg-[#b76dff]/20 text-[#ddb7ff]" : "bg-[#1f1f24] text-white/70"
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
                    className={`rounded-2xl p-2.5 text-center ${selected ? "bg-[#ddb7ff]/10 text-[#e4e1e9]" : "bg-[#1f1f24] text-white/70"}`}
                  >
                    <Icon name={item.icon} className={selected ? "text-[#ddb7ff]" : "text-white/60"} />
                    <span className="mt-1 block text-xs font-bold">{item.title}</span>
                    <span className="block text-[10px] text-[#ffb95f]">{item.detail}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-white/15 bg-[#1f1f24] p-3">
            <div className="flex items-center gap-2">
              <Icon name="add_a_photo" className="text-[#ffb95f]" />
              <div>
                <p className="text-sm font-semibold">Landmark / Waiting Spot Photo</p>
                <p className="text-xs text-white/60">Optional • Fast spotting</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-white/70">
              Not uploaded. SheRides has no pickup-photo store yet, so this picture stays on your phone and is not sent to a captain.
            </p>
            <label className="mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[#2a292f] px-4 text-sm font-semibold">
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
              <p className="mt-2 text-xs text-white/70">
                {photoName} · on this device only
                <button type="button" className="ml-2 font-semibold text-[#ddb7ff]" onClick={() => setPhotoName(null)}>
                  Remove
                </button>
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Special Pickup Note for Captain</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">Optional</span>
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              {QUICK_NOTES.map((item) => {
                const selected = quick.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuick((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]))}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selected ? "bg-[#b76dff]/20 text-[#ddb7ff]" : "bg-[#1f1f24] text-white/70"}`}
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
              className="w-full rounded-2xl border border-white/10 bg-[#0e0e13] px-4 py-3 text-sm text-[#e4e1e9] placeholder:text-white/35"
            />
          </div>

          <p className="flex items-start gap-2 text-xs text-white/70">
            <Icon name="shield_with_heart" className="shrink-0 text-[#ffb95f]" size={18} />
            Sanctuary Arrival Promise. Captain waits up to 3 mins complimentary inside this safe perimeter. A camera check is not recorded in the app.
          </p>
          <button
            type="button"
            onClick={() => {
              setAttached(true);
              setOpen(false);
            }}
            className="h-12 rounded-full bg-gradient-to-br from-[#A855F7] to-[#6366F1] text-sm font-semibold text-white"
          >
            Confirm Pickup Spot
          </button>
        </div>
      )}
    </section>
  );
}

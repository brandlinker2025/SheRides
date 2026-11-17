"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  WAITING_PER_MINUTE,
  formatTaka,
  goErrorMessage,
  roadKm,
  sheRidesFare,
  type GoPlace,
  type GoRideKind,
  type GoService,
} from "@/lib/go";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/storage";
import { PlaceInput } from "./PlaceInput";

const KINDS: { id: GoRideKind; label: string; bn: string }[] = [
  { id: "now", label: "Ride now", bn: "এখনই" },
  { id: "scheduled", label: "Pre-book", bn: "প্রি-বুক" },
  { id: "hire", label: "Hire", bn: "হায়ার" },
];

function minDateTime() {
  const d = new Date(Date.now() + 20 * 60 * 1000);
  d.setSeconds(0, 0);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function maxDateTime() {
  const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function joinDateTime(date: string, time: string) {
  if (!date || !time) return "";
  return `${date}T${time}`;
}

function serviceRpcMissing(message: string) {
  return /schema cache|could not find the function|p_service|go_service_fare|column ["']?service/i.test(message);
}

function FareBreakdown({ kind, km, hours }: { kind: GoRideKind; km: number | null; hours: number }) {
  const amount = sheRidesFare(kind, km, hours);
  return (
    <section aria-label="Fare" className="sr-fare">
      <div>
        <p className="sr-fare-label">{kind === "hire" ? "Hire (admin confirm করবেন)" : "ভাড়া"}</p>
        <p className="sr-fare-amount">{amount != null ? formatTaka(amount) : "—"}</p>
      </div>
      <p className="sr-fare-meta">
        {kind === "hire"
          ? `${hours} ঘণ্টা × ৳300 · অতিরিক্ত কিমি ৳15`
          : km != null
            ? `${km.toFixed(1)} km${kind === "now" ? " × ৳30" : ""}`
            : "গন্তব্য দিলে ভাড়া দেখাবে"}
        <span className="block">অপেক্ষা ৳{WAITING_PER_MINUTE[kind]}/মিনিট</span>
      </p>
    </section>
  );
}

type BookRideProps = {
  pickup: GoPlace | null;
  drop: GoPlace | null;
  onPickup: (place: GoPlace | null) => void;
  onDrop: (place: GoPlace | null) => void;
  autoLocate?: boolean;
};

const PAYMENTS = [
  { id: "cash", label: "Cash" },
  { id: "bkash", label: "bKash" },
] as const;

const fieldClass =
  "h-12 w-full rounded-2xl border border-[#e4d8ff] bg-[#f8f4ff] px-4 text-sm text-[#251b3a] placeholder:text-[#8a7d9e]";

/** Live Ride booking: ride type → pickup → where to (+ optional stop) → pickup details → payment → fare → request. */
export function BookRide({ pickup, drop, onPickup, onDrop, autoLocate = true }: BookRideProps) {
  const router = useRouter();
  const [kind, setKind] = useState<GoRideKind>("now");
  const service: GoService = "ev_bike";
  const [when, setWhen] = useState("");
  const [hours, setHours] = useState(2);
  const [payment, setPayment] = useState<"cash" | "bkash">("cash");
  const [stopOpen, setStopOpen] = useState(false);
  const [stop, setStop] = useState<GoPlace | null>(null);
  const [landmark, setLandmark] = useState("");
  const [waiting, setWaiting] = useState("");
  const [captainNote, setCaptainNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const photoUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const km = useMemo(() => (pickup && drop ? roadKm(pickup, drop) : null), [pickup, drop]);


  const canSubmit = Boolean(pickup) && (kind === "hire" || Boolean(drop)) && (kind !== "scheduled" || Boolean(when));
  const note = [
    landmark.trim() && `Landmark: ${landmark.trim()}`,
    waiting.trim() && `Waiting at: ${waiting.trim()}`,
    captainNote.trim(),
  ].filter(Boolean).join(" · ").slice(0, 300);

  async function sendPhoto(rideId: string) {
    if (!photo) return;
    const supabase = createClient();
    if (!supabase) return;
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const blob = await compressImage(photo, 1280, 0.8);
      const path = `${data.user.id}/${rideId}/landmark-${Date.now()}.${blob.type === "image/png" ? "png" : "jpg"}`;
      const up = await supabase.storage.from("ride-landmarks").upload(path, blob, { contentType: blob.type });
      if (!up.error) await supabase.rpc("go_set_landmark_photo", { p_ride_id: rideId, p_path: path });
    } catch {
      /* The ride is booked; she can still send the photo from the ride screen. */
    }
  }

  async function submit() {
    setError(null);
    if (!pickup) return setError("Set a pickup point, or allow location access.");
    if (kind !== "hire" && !drop) return setError("Choose where you are going from the suggestions.");
    if (kind === "scheduled" && !when) return setError("Choose a pickup date and time.");
    const supabase = createClient();
    if (!supabase) return setError("Ride booking is not connected yet.");
    setBusy(true);
    const payload = {
      p_kind: kind,
      p_pickup_text: pickup.label,
      p_pickup_lat: pickup.lat,
      p_pickup_lng: pickup.lng,
      p_drop_text: drop?.label ?? null,
      p_drop_lat: drop?.lat ?? null,
      p_drop_lng: drop?.lng ?? null,
      p_scheduled_at: kind !== "now" && when ? new Date(when).toISOString() : null,
      p_hire_hours: kind === "hire" ? hours : null,
      p_payment: payment,
      p_note: note || null,
    };
    let result = await supabase.rpc("go_request_ride", { ...payload, p_service: service });
    if (result.error && serviceRpcMissing(result.error.message)) {
      result = await supabase.rpc("go_request_ride", payload);
    }
    if (result.error || !result.data) {
      setBusy(false);
      setError(goErrorMessage(result.error));
      return;
    }
    const rideId = String(result.data);
    if (stop) {
      await supabase.rpc("go_add_ride_stop", { p_ride_id: rideId, p_label: stop.label, p_lat: stop.lat, p_lng: stop.lng });
    }
    await sendPhoto(rideId);
    setBusy(false);
    router.push(`/?flow=ride&trip=${rideId}`);
  }

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* 1. Ride type first */}
      <div className="sr-segment" role="tablist" aria-label="Ride type">
        {KINDS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={kind === item.id}
            onClick={() => setKind(item.id)}
            className={`sr-segment-btn ${kind === item.id ? "is-on" : ""}`}
          >
            <Icon name={item.id === "now" ? "electric_moped" : item.id === "scheduled" ? "schedule" : "timer"} size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {kind === "scheduled" && (
        <div className="sr-card grid grid-cols-2 gap-2">
          <label className="block">
            <span className="sr-mini-label">তারিখ</span>
            <input type="date" min={minDateTime().slice(0, 10)} max={maxDateTime().slice(0, 10)} value={when.slice(0, 10)}
              onChange={(event) => setWhen(joinDateTime(event.target.value, when.slice(11, 16) || "09:00"))}
              className={`${fieldClass} px-3 [color-scheme:light]`} />
          </label>
          <label className="block">
            <span className="sr-mini-label">সময়</span>
            <input type="time" value={when.slice(11, 16)}
              onChange={(event) => setWhen(joinDateTime(when.slice(0, 10) || minDateTime().slice(0, 10), event.target.value))}
              className={`${fieldClass} px-3 [color-scheme:light]`} />
          </label>
        </div>
      )}
      {kind === "hire" && (
        <div className="sr-card flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold text-[#251b3a]"><span className="sr-tile sr-tile-peach"><Icon name="timer" size={18} /></span> কত ঘণ্টা?</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setHours((v) => Math.max(1, v - 1))} className="sr-round" aria-label="Fewer hours">−</button>
            <span className="w-12 text-center text-xl font-extrabold text-[#251b3a]">{hours}h</span>
            <button type="button" onClick={() => setHours((v) => Math.min(12, v + 1))} className="sr-round" aria-label="More hours">+</button>
          </div>
        </div>
      )}

      {/* 2. Route: pickup → where to (+ stop) */}
      <div className="sr-card sr-route">
        <span className="sr-route-line" aria-hidden="true" />
        <PlaceInput label="Pickup / পিকআপ" icon="trip_origin" value={pickup} onChange={onPickup} allowCurrentLocation
          autoLocate={autoLocate && !pickup} placeholder="এখানে লিখুন বা current location" />
        <PlaceInput label="Where to? / কোথায়?" icon="flag" value={drop} onChange={onDrop} near={pickup} placeholder="কোথায় যাবেন?" />
        {stopOpen ? (
          <PlaceInput label="Stop / থামবেন" icon="add_location_alt" value={stop} onChange={setStop} near={pickup} placeholder="পথে কোথাও থামবেন?" />
        ) : (
          <button type="button" onClick={() => setStopOpen(true)} className="sr-add-stop">
            <Icon name="add_box" size={20} /> Add stop
          </button>
        )}
      </div>

      {/* 3. Pickup details */}
      {confirmed ? (
        <button type="button" onClick={() => setConfirmed(false)} className="sr-card flex items-center gap-3 text-left">
          <span className="sr-tile sr-tile-aqua"><Icon name="check_circle" size={20} filled /></span>
          <span className="min-w-0 flex-1 text-sm text-[#0a3f3a]">
            <b>Pickup confirmed</b>
            <span className="block truncate text-[#5e5276]">{[landmark, waiting, photo ? "ছবি যোগ হয়েছে" : ""].filter(Boolean).join(" · ") || "অতিরিক্ত তথ্য নেই"}</span>
          </span>
          <span className="text-xs font-bold text-[#7044f5]">Edit</span>
        </button>
      ) : (
        <div className="sr-card flex flex-col gap-2.5">
          <p className="flex items-center gap-2 text-sm font-bold text-[#251b3a]">
            <span className="sr-tile sr-tile-pink"><Icon name="location_on" size={18} /></span>
            Pickup details <span className="font-normal text-[#5e5276]">(ঐচ্ছিক)</span>
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input value={landmark} onChange={(e) => setLandmark(e.target.value)} maxLength={80} placeholder="Landmark (যেমন Agora gate)" aria-label="Landmark" className={fieldClass} />
            <input value={waiting} onChange={(e) => setWaiting(e.target.value)} maxLength={80} placeholder="Waiting spot (যেমন guard booth)" aria-label="Waiting spot" className={fieldClass} />
          </div>
          <label className="sr-photo">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen photo
              <img src={photoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
            ) : (
              <span className="sr-tile sr-tile-peach"><Icon name="add_a_photo" size={18} /></span>
            )}
            <span className="min-w-0 flex-1">
              <b className="block">{photo ? "ছবি যোগ হয়েছে" : "Landmark-এর ছবি"}</b>
              <span className="block text-xs text-[#5e5276]">{photo ? "বদলাতে চাপুন" : "Captain সহজে চিনবে"}</span>
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </label>
          <textarea value={captainNote} onChange={(e) => setCaptainNote(e.target.value)} maxLength={140} rows={2} placeholder="Captain-এর জন্য নোট (ঐচ্ছিক)" aria-label="Note for your captain"
            className="w-full rounded-2xl border border-[#e4d8ff] bg-[#f8f4ff] px-4 py-3 text-sm text-[#251b3a] placeholder:text-[#8a7d9e]" />
          <button type="button" onClick={() => setConfirmed(true)} className="public-action public-mint w-full">
            <Icon name="check" size={20} /> Confirm pickup
          </button>
        </div>
      )}

      {/* 4. Payment */}
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment">
        {PAYMENTS.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={payment === m.id} onClick={() => setPayment(m.id)}
            className={`sr-pay ${payment === m.id ? "is-on" : ""}`}>
            <span className={`sr-tile ${m.id === "cash" ? "sr-tile-aqua" : "sr-tile-pink"}`}><Icon name={m.id === "cash" ? "payments" : "account_balance_wallet"} size={18} /></span>
            <span className="font-bold">{m.label}</span>
            {payment === m.id && <Icon name="check_circle" size={18} filled className="ml-auto text-[#7044f5]" />}
          </button>
        ))}
      </div>

      <FareBreakdown kind={kind} km={kind === "hire" ? null : km} hours={hours} />
      {kind === "hire" && (
        <p className="rounded-2xl bg-[#fff6ec] px-4 py-3 text-sm text-[#7a4a10]">
          Hire request সরাসরি confirm হয় না। SheRides admin বা moderator ভাড়া ঠিক করে captain দিয়ে দেবেন, তখন notification পাবেন।
        </p>
      )}
      {error && <p className="rounded-2xl bg-[#ffeef3] px-4 py-3 text-sm text-[#a82144]" role="alert">{error}</p>}

      {/* Sticky request bar */}
      <div className="sr-request-bar">
        <button type="button" disabled={busy || !canSubmit} onClick={() => void submit()} aria-busy={busy} className="btn btn-primary h-14 w-full text-lg">
          <Icon name="electric_moped" size={22} />
          {busy ? "Request হচ্ছে…" : kind === "now" ? "Request ride" : kind === "hire" ? "Send hire request" : "Pre-book ride"}
        </button>
      </div>
    </div>
  );
}

type RideDeckProps = {
  children?: React.ReactNode;
  below?: React.ReactNode;
  showForm?: boolean;
  initialPickup?: GoPlace | null;
  initialDrop?: GoPlace | null;
};

export function RideDeck({ children, below, showForm = true, initialPickup = null, initialDrop = null }: RideDeckProps) {
  const [pickup, setPickup] = useState<GoPlace | null>(initialPickup);
  const [drop, setDrop] = useState<GoPlace | null>(initialDrop);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col bg-transparent p-1 text-[#251b3a] sm:p-2">
      {children}
      {showForm ? (
        <BookRide pickup={pickup} drop={drop} onPickup={setPickup} onDrop={setDrop} autoLocate={!initialPickup} />
      ) : null}
      {below}
    </div>
  );
}

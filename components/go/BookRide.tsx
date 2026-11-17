"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  FARE_RATES,
  bookableRates,
  distanceFare,
  estimateFare,
  formatTaka,
  goErrorMessage,
  legacyDistanceFare,
  ratesFromCatalog,
  roadKm,
  type FareRate,
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

function FareBreakdown({
  km,
  rate,
  hireFare,
  hours,
  catalogLive,
}: {
  km: number | null;
  rate: FareRate;
  hireFare: number | null;
  hours: number;
  catalogLive: boolean;
}) {
  const distance = km != null ? (catalogLive ? distanceFare(km, rate.id, [rate]) : legacyDistanceFare(km)) : null;
  const beyond = distance != null && km != null && km > rate.slabKm ? distance - rate.slabKm * rate.basePerKm : 0;
  return (
    <section aria-label="Fare breakdown" className="rounded-3xl border border-[#e4d8ff] bg-[#ffffff]/95 px-4 py-4 text-[#251b3a] backdrop-blur-xl">
      <h2 className="text-sm font-semibold">Fare / ভাড়া</h2>
      {distance == null || km == null ? (
        <p className="mt-1 text-3xl font-bold">—</p>
      ) : catalogLive ? (
        <>
          <p className="mt-1 text-3xl font-bold text-[#7044f5]">{formatTaka(distance)}</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-[#5e5276]">
            {km <= rate.slabKm ? (
              <li>
                {km.toFixed(2)} km × ৳{rate.basePerKm.toFixed(2)} = {formatTaka(distance)}
              </li>
            ) : (
              <>
                <li>
                  First {rate.slabKm} km × ৳{rate.basePerKm} = {formatTaka(rate.slabKm * rate.basePerKm)}
                </li>
                <li>
                  {(km - rate.slabKm).toFixed(2)} km × ৳{rate.extraPerKm} = {formatTaka(beyond)}
                </li>
              </>
            )}
          </ul>
        </>
      ) : (
        <>
          <p className="mt-1 text-3xl font-bold text-[#7044f5]">{formatTaka(distance)}</p>
          <p className="mt-2 text-sm text-[#5e5276]">
            {km.toFixed(2)} km · ৳30 + ৳14/km · minimum ৳70
          </p>
        </>
      )}
      {hireFare != null ? (
        <p className="mt-2 text-sm text-[#5e5276]">
          Hire total {formatTaka(hireFare)} ({hours} h × ৳250)
        </p>
      ) : null}
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
  const [rates, setRates] = useState<FareRate[]>(() => bookableRates(FARE_RATES));
  const [fareSource, setFareSource] = useState<"unknown" | "catalog" | "legacy">("unknown");
  const [when, setWhen] = useState("");
  const [hours, setHours] = useState(2);
  const [payment, setPayment] = useState<"cash" | "bkash">("cash");
  const [stopOpen, setStopOpen] = useState(false);
  const [stop, setStop] = useState<GoPlace | null>(null);
  const [landmark, setLandmark] = useState("");
  const [waiting, setWaiting] = useState("");
  const [captainNote, setCaptainNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const km = useMemo(() => (pickup && drop ? roadKm(pickup, drop) : null), [pickup, drop]);
  const selectedRate = rates.find((rate) => rate.id === service) ?? rates[0];
  const hireFare = kind === "hire" ? estimateFare("hire", null, hours, service, rates) : null;
  const catalogLive = fareSource === "catalog";

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setFareSource("legacy");
      return;
    }
    void supabase.rpc("go_list_fare_rates").then(({ data, error: loadError }) => {
      if (loadError || !data) {
        setFareSource("legacy");
        return;
      }
      const next = bookableRates(ratesFromCatalog(data as Parameters<typeof ratesFromCatalog>[0]));
      if (!next.length) {
        setFareSource("legacy");
        return;
      }
      setRates(next);
      setFareSource("catalog");
    });
  }, []);

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
    let result =
      fareSource === "legacy"
        ? await supabase.rpc("go_request_ride", payload)
        : await supabase.rpc("go_request_ride", { ...payload, p_service: service });
    if (result.error && serviceRpcMissing(result.error.message)) {
      setFareSource("legacy");
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
    <div className="flex flex-col gap-3">
      {/* 1. Ride type first */}
      <div className="grid grid-cols-3 gap-1 rounded-full bg-[#e9dfff] p-1" role="tablist" aria-label="Ride type">
        {KINDS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={kind === item.id}
            onClick={() => setKind(item.id)}
            className={`h-11 rounded-full text-sm font-bold transition-colors ${
              kind === item.id
                ? "bg-gradient-to-b from-[#9466f6] to-[#7244f2] text-white shadow-[0_8px_16px_-8px_#7244f2]"
                : "text-[#4a2e8a]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {kind === "scheduled" && (
        <div className="grid grid-cols-2 gap-2 rounded-3xl border border-[#e4d8ff] bg-white p-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#5e5276]">Date</span>
            <input
              type="date"
              min={minDateTime().slice(0, 10)}
              max={maxDateTime().slice(0, 10)}
              value={when.slice(0, 10)}
              onChange={(event) => setWhen(joinDateTime(event.target.value, when.slice(11, 16) || "09:00"))}
              className={`${fieldClass} px-3 [color-scheme:light]`}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#5e5276]">Time</span>
            <input
              type="time"
              value={when.slice(11, 16)}
              onChange={(event) => setWhen(joinDateTime(when.slice(0, 10) || minDateTime().slice(0, 10), event.target.value))}
              className={`${fieldClass} px-3 [color-scheme:light]`}
            />
          </label>
        </div>
      )}
      {kind === "hire" && (
        <div className="flex items-center justify-between rounded-3xl border border-[#e4d8ff] bg-white p-3">
          <span className="text-sm font-semibold text-[#251b3a]">কত ঘণ্টা?</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setHours((v) => Math.max(1, v - 1))} className="h-10 w-10 rounded-full bg-[#e9dfff] text-xl font-bold text-[#4a2e8a]" aria-label="Fewer hours">−</button>
            <span className="w-12 text-center text-xl font-bold">{hours} h</span>
            <button type="button" onClick={() => setHours((v) => Math.min(12, v + 1))} className="h-10 w-10 rounded-full bg-[#e9dfff] text-xl font-bold text-[#4a2e8a]" aria-label="More hours">+</button>
          </div>
        </div>
      )}

      {/* 2. Pickup and where to (+ optional stop) */}
      <div className="rounded-3xl border border-[#e4d8ff] bg-white p-4">
        <div className="relative flex flex-col gap-3 pl-5">
          <span className="absolute bottom-6 left-[7px] top-6 w-px bg-gradient-to-b from-[#3fd0c1] to-[#7044f5]" aria-hidden="true" />
          <PlaceInput
            label="Pickup / পিকআপ"
            icon="trip_origin"
            value={pickup}
            onChange={onPickup}
            allowCurrentLocation
            autoLocate={autoLocate && !pickup}
            placeholder="Current location or landmark"
          />
          <PlaceInput label="Where to? / কোথায়?" icon="flag" value={drop} onChange={onDrop} placeholder="Drop-off area or place" />
          {stopOpen ? (
            <PlaceInput label="Stop / থামবেন" icon="add_location_alt" value={stop} onChange={setStop} placeholder="A stop on the way" />
          ) : (
            <button type="button" onClick={() => setStopOpen(true)} className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-[#7044f5]">
              <Icon name="add_box" size={20} /> Add stop
            </button>
          )}
        </div>
      </div>

      {/* 3. Pickup details: landmark, waiting spot, photo, note, confirm */}
      {pickup && (
        confirmed ? (
          <button type="button" onClick={() => setConfirmed(false)} className="flex items-center gap-3 rounded-3xl border border-[#aeeee6] bg-[#effffc] p-3 text-left">
            <Icon name="check_circle" className="text-[#24afa2]" filled />
            <span className="min-w-0 flex-1 text-sm text-[#0a3f3a]">
              <b>Pickup confirmed</b>
              <span className="block truncate">{[landmark, waiting, photo ? "photo added" : ""].filter(Boolean).join(" · ") || "No extra details"}</span>
            </span>
            <span className="text-xs font-bold text-[#7044f5]">Edit</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-3xl border border-[#e4d8ff] bg-white p-4">
            <p className="text-sm font-bold text-[#251b3a]">Pickup details <span className="font-normal text-[#5e5276]">(optional)</span></p>
            <input value={landmark} onChange={(e) => setLandmark(e.target.value)} maxLength={80} placeholder="Landmark (e.g. Agora gate)" aria-label="Landmark" className={fieldClass} />
            <input value={waiting} onChange={(e) => setWaiting(e.target.value)} maxLength={80} placeholder="Waiting spot (e.g. guard booth)" aria-label="Waiting spot" className={fieldClass} />
            <label className="flex h-12 cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-[#c9b6f7] bg-[#f8f4ff] px-4 text-sm font-semibold text-[#4a2e8a]">
              <Icon name="add_a_photo" size={20} />
              <span className="min-w-0 flex-1 truncate">{photo ? photo.name : "Landmark photo"}</span>
              {photo && <span className="text-xs text-[#7044f5]">Change</span>}
              <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
            </label>
            <textarea value={captainNote} onChange={(e) => setCaptainNote(e.target.value)} maxLength={140} rows={2} placeholder="Note for your captain" aria-label="Note for your captain" className="w-full rounded-2xl border border-[#e4d8ff] bg-[#f8f4ff] px-4 py-3 text-sm text-[#251b3a] placeholder:text-[#8a7d9e]" />
            <button type="button" onClick={() => setConfirmed(true)} className="public-action public-mint w-full">
              <Icon name="check" size={20} /> Confirm pickup
            </button>
          </div>
        )
      )}

      {/* 4. Payment: Cash or bKash */}
      <div className="flex items-center justify-between gap-3 rounded-3xl border border-[#e4d8ff] bg-white p-3">
        <span className="text-sm font-bold text-[#251b3a]">Payment</span>
        <div className="grid grid-cols-2 gap-1 rounded-full bg-[#e9dfff] p-1">
          {PAYMENTS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPayment(m.id)}
              className={`h-9 rounded-full px-5 text-sm font-bold ${payment === m.id ? "bg-white text-[#7044f5] shadow" : "text-[#5e5276]"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <FareBreakdown km={kind === "hire" ? null : km} rate={selectedRate} hireFare={hireFare} hours={hours} catalogLive={catalogLive} />

      {error && <p className="text-sm text-[#a82144]" role="alert">{error}</p>}
      <button type="button" disabled={busy || !canSubmit} onClick={() => void submit()} aria-busy={busy} className="btn btn-primary h-14 w-full text-lg">
        {busy ? "Requesting…" : kind === "now" ? "Request ride" : kind === "hire" ? "Request hire" : "Pre-book ride"}
      </button>
      {!canSubmit && (
        <p className="text-center text-sm text-[#5e5276]">
          {!pickup ? "Allow location or type your pickup" : kind === "scheduled" && !when ? "Choose date and time" : "Add where you are going"}
        </p>
      )}
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

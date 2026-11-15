"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  FARE_RATES,
  SERVICE_LABEL,
  FLEET_COPY,
  distanceFare,
  estimateFare,
  estimatePickupMinutes,
  estimateTripMinutes,
  formatTaka,
  goErrorMessage,
  ratesFromCatalog,
  roadKm,
  type FareRate,
  type GoPlace,
  type GoRideKind,
  type GoService,
} from "@/lib/go";
import { createClient } from "@/lib/supabase/client";
import { PickupSpot } from "./PickupSpot";
import { PlaceInput } from "./PlaceInput";
import { RideMap } from "./RideMap";

const KINDS: { id: GoRideKind; label: string }[] = [
  { id: "now", label: "Ride now" },
  { id: "scheduled", label: "Schedule" },
  { id: "hire", label: "Hire" },
];

function minDateTime() {
  const d = new Date(Date.now() + 20 * 60 * 1000);
  d.setSeconds(0, 0);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function serviceRpcMissing(message: string) {
  return /schema cache|could not find the function|p_service|go_service_fare|column ["']?service/i.test(message);
}

function FareBreakdown({
  km,
  rate,
  hireFare,
}: {
  km: number | null;
  rate: FareRate;
  hireFare: number | null;
}) {
  const distance = km != null ? distanceFare(km, rate.id, [rate]) : null;
  const beyond = distance != null && km != null && km > rate.slabKm ? distance - rate.slabKm * rate.basePerKm : 0;
  return (
    <section aria-label="Fare breakdown" className="rounded-[22px] border border-white/10 bg-[#1f1f24] px-4 py-4 text-[#e4e1e9] backdrop-blur-xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">{rate.label}</p>
      <h2 className="mt-1 text-sm font-semibold">Transparent Fare Calculation</h2>
      {distance == null || km == null ? (
        <p className="mt-1 text-3xl font-bold">—</p>
      ) : (
        <>
          <p className="mt-1 text-3xl font-bold">{formatTaka(distance)}</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-secondary">
            {km <= rate.slabKm ? (
              <li>
                Base transit rate ({km.toFixed(2)} km × ৳{rate.basePerKm.toFixed(2)}/km) = {formatTaka(distance)}
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
      )}
      {hireFare != null ? <p className="mt-2 text-sm text-secondary">Hourly hire {formatTaka(hireFare)}. The distance fare above is the ride-now price.</p> : null}
      <div className="mt-4 border-t border-white/15 pt-3">
        <h2 className="text-sm font-semibold">Grace Pickup Window: {rate.waitingGraceMinutes} Free Minutes</h2>
        <p className="text-2xl font-bold">
          {formatTaka(rate.waitingPerMinute)} <span className="text-base font-semibold text-secondary">per minute</span>
        </p>
        <p className="mt-1 text-sm text-secondary">
          Captain waits at the designated pickup spot. Post-grace charge: {formatTaka(rate.waitingPerMinute)} BDT/min. It stays separate from the distance fare and also covers a pause or traffic delay after the ride starts.
        </p>
      </div>
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

export function BookRide({ pickup, drop, onPickup, onDrop, autoLocate = true }: BookRideProps) {
  const router = useRouter();
  const [kind, setKind] = useState<GoRideKind>("now");
  const [service, setService] = useState<GoService>("ev_bike");
  const [rates, setRates] = useState<FareRate[]>(FARE_RATES);
  const [when, setWhen] = useState("");
  const [hours, setHours] = useState(2);
  const [payment, setPayment] = useState<"cash" | "bkash" | "nagad">("cash");
  const [note, setNote] = useState("");
  const onPickupNote = useCallback((value: string) => setNote(value), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const km = useMemo(() => (pickup && drop ? roadKm(pickup, drop) : null), [pickup, drop]);
  const selectedRate = rates.find((rate) => rate.id === service) ?? rates[0];
  const hireFare = kind === "hire" ? estimateFare("hire", null, hours, service, rates) : null;

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    void supabase.rpc("go_list_fare_rates").then(({ data, error: loadError }) => {
      if (loadError || !data) return;
      setRates(ratesFromCatalog(data as Parameters<typeof ratesFromCatalog>[0]));
    });
  }, []);
  const canSubmit = Boolean(pickup) && (kind === "hire" || Boolean(drop)) && (kind !== "scheduled" || Boolean(when));

  async function submit() {
    setError(null);
    if (!pickup) return setError("Set a pickup point, or allow location access.");
    if (kind !== "hire" && !drop) return setError("Choose a drop-off from the suggestions.");
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
      p_note: note.trim() || null,
    };
    let result = await supabase.rpc("go_request_ride", { ...payload, p_service: service });
    if (result.error && serviceRpcMissing(result.error.message)) {
      const tagged = [SERVICE_LABEL[service], note.trim()].filter(Boolean).join(" · ").slice(0, 300);
      result = await supabase.rpc("go_request_ride", { ...payload, p_note: tagged || null });
    }
    setBusy(false);
    if (result.error || !result.data) {
      setError(goErrorMessage(result.error));
      return;
    }
    router.push(`/go/ride/${String(result.data)}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[28px] border border-white/10 bg-[#1f1f24]/90 p-4 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-5">
        <div className="relative flex flex-col gap-3 pl-5">
          <span className="absolute bottom-6 left-[7px] top-6 w-px bg-gradient-to-b from-cyan-400 to-violet-400" aria-hidden="true" />
          <PlaceInput
            label="Pickup"
            icon="trip_origin"
            value={pickup}
            onChange={onPickup}
            allowCurrentLocation
            autoLocate={autoLocate && !pickup}
            placeholder="Current location or a landmark"
          />
          <PlaceInput
            label="Where to?"
            icon="flag"
            value={drop}
            onChange={onDrop}
            placeholder="Drop-off — area, road or place"
          />
        </div>

        <div className="mt-4 flex gap-2">
          {KINDS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setKind(item.id)}
              className={`h-9 flex-1 rounded-full border text-sm font-semibold ${
                kind === item.id
                  ? "border-transparent bg-gradient-to-br from-[#A855F7] to-[#6366F1] text-white"
                  : "border-white/10 bg-[#121217] text-white/70"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {kind !== "now" && (
          <label className="mt-3 block">
            <span className="mb-1.5 block text-sm font-semibold text-secondary">
              {kind === "hire" ? "Start time (optional)" : "Pickup date and time"}
            </span>
            <input
              type="datetime-local"
              min={minDateTime()}
              value={when}
              onChange={(event) => setWhen(event.target.value)}
              className="w-full rounded-xl border border-surface-border bg-soft-off-white px-4 py-3"
            />
          </label>
        )}
        {kind === "hire" && (
          <div className="mt-3 flex items-center gap-3">
            <button type="button" onClick={() => setHours((value) => Math.max(1, value - 1))} className="h-11 w-11 rounded-full border border-surface-border text-xl font-bold" aria-label="Fewer hours">
              −
            </button>
            <span className="w-16 text-center text-2xl font-bold">{hours} h</span>
            <button type="button" onClick={() => setHours((value) => Math.min(12, value + 1))} className="h-11 w-11 rounded-full border border-surface-border text-xl font-bold" aria-label="More hours">
              +
            </button>
          </div>
        )}
      </div>

      {pickup && <PickupSpot pickupLabel={pickup.label} onNote={onPickupNote} />}

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#e4e1e9]">Available Sanctuary Fleet</h2>
          <span className="text-xs font-semibold text-[#ddb7ff]">Dhaka Traffic: Moderate</span>
        </div>
        <p className="mb-2 text-[11px] text-white/45">Traffic status is not live yet. This label is a placeholder, not a measured feed.</p>
        <div className="flex flex-col gap-2.5" role="listbox" aria-label="Choose a vehicle">
          {rates.map((item, index) => {
            const copy = FLEET_COPY[item.id];
            const selected = service === item.id;
            const fare = km != null && kind !== "hire" ? distanceFare(km, item.id, rates) : null;
            const pickupMin = estimatePickupMinutes(item.id, km);
            const tripMin = estimateTripMinutes(item.id, km);
            return (
              <motion.button
                key={item.id}
                type="button"
                role="option"
                aria-selected={selected}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.28 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => setService(item.id)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-[#e4e1e9] ${
                  selected ? "bg-[#2a292f] shadow-md ring-1 ring-[#A855F7]/40" : "bg-[#1f1f24]"
                }`}
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${selected ? "bg-[#ddb7ff]/15 text-[#ddb7ff]" : "bg-[#35343a] text-white/70"}`}>
                  <Icon name={item.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{copy.title}</span>
                    <span className="rounded-full bg-[#ffb95f]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ffb95f]">{copy.badge}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-white/70">
                    {pickupMin} min away
                    {tripMin != null ? ` · ${tripMin} min trip` : ""}
                    {" · 1 seat · "}
                    {copy.perk}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-white/55">{copy.blurb}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-extrabold text-[#ddb7ff]">{fare != null ? formatTaka(fare) : "—"}</span>
                  <span className="block text-[10px] uppercase tracking-wide text-white/45">Distance</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#1f1f24] p-3 text-[#e4e1e9]">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Payment method</p>
          <p className="truncate text-sm font-semibold">{payment === "bkash" ? "bKash" : payment === "nagad" ? "Nagad" : "Cash"}</p>
          <p className="text-[11px] text-white/45">No saved wallet number. Pay the captain directly.</p>
        </div>
        <div className="flex shrink-0 rounded-full bg-[#2a292f] p-1">
          {(["bkash", "nagad", "cash"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPayment(method)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${payment === method ? "bg-[#b76dff] text-[#400071]" : "text-white/70"}`}
            >
              {method === "bkash" ? "bKash" : method === "nagad" ? "Nagad" : "Cash"}
            </button>
          ))}
        </div>
      </div>

      <FareBreakdown km={kind === "hire" ? null : km} rate={selectedRate} hireFare={hireFare} />

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={busy || !canSubmit}
        onClick={() => void submit()}
        className="h-14 rounded-full bg-gradient-to-br from-[#A855F7] to-[#6366F1] text-lg font-semibold text-white disabled:bg-[#1A1A24] disabled:text-white/30"
      >
        {busy ? "Requesting…" : kind === "now" ? "Request SheRides Ride" : kind === "hire" ? "Request hire" : "Schedule SheRides Ride"}
      </button>
      {!canSubmit && (
        <p className="text-center text-sm text-tertiary">
          {pickup ? "Add a destination to see fares and request a ride." : "Allow location, or type a pickup, to start."}
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

/** Booking sheet beside the map. The page scroll stays on the app shell. */
export function RideDeck({ children, below, showForm = true, initialPickup = null, initialDrop = null }: RideDeckProps) {
  const [pickup, setPickup] = useState<GoPlace | null>(initialPickup);
  const [drop, setDrop] = useState<GoPlace | null>(initialDrop);

  return (
    <div className="flex w-full min-w-0 flex-col bg-[#131318] text-[#e4e1e9] lg:grid lg:grid-cols-[minmax(300px,440px)_minmax(0,1fr)] lg:items-start">
      <div className="order-1 h-[240px] min-w-0 p-3 sm:h-[280px] sm:p-4 lg:sticky lg:top-0 lg:order-2 lg:h-[calc(100dvh-72px)] lg:pl-0">
        <RideMap pickup={pickup} drop={drop} />
      </div>
      <div className="order-2 flex min-w-0 flex-col gap-4 px-4 py-4 pb-28 sm:px-6 lg:order-1 lg:py-6 lg:pb-6">
        {children}
        {showForm ? (
          <BookRide pickup={pickup} drop={drop} onPickup={setPickup} onDrop={setDrop} autoLocate={!initialPickup} />
        ) : null}
        {below}
      </div>
    </div>
  );
}

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
  legacyDistanceFare,
  ratesFromCatalog,
  rideNoteWithPreference,
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

const KINDS: { id: GoRideKind; label: string; bn: string }[] = [
  { id: "now", label: "Ride now", bn: "এখনই" },
  { id: "scheduled", label: "Schedule", bn: "সিডিউল" },
  { id: "hire", label: "Hire", bn: "হায়ার" },
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
    <section aria-label="Fare breakdown" className="rounded-3xl border border-white/10 bg-[#1f1f24]/95 px-4 py-4 text-[#e4e1e9] backdrop-blur-xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#ffb95f]">{catalogLive ? rate.label : "Standard rate"}</p>
      <h2 className="mt-1 text-sm font-semibold">Transparent Fare / স্বচ্ছ ভাড়া</h2>
      {distance == null || km == null ? (
        <p className="mt-1 text-3xl font-bold">—</p>
      ) : catalogLive ? (
        <>
          <p className="mt-1 text-3xl font-bold text-[#ddb7ff]">{formatTaka(distance)}</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-white/70">
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
          <p className="mt-1 text-3xl font-bold text-[#ddb7ff]">{formatTaka(distance)}</p>
          <p className="mt-2 text-sm text-white/70">
            {km.toFixed(2)} km · ৳30 + ৳14/km · minimum ৳70
          </p>
        </>
      )}
      {hireFare != null ? (
        <p className="mt-2 text-sm text-white/60">
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

export function BookRide({ pickup, drop, onPickup, onDrop, autoLocate = true }: BookRideProps) {
  const router = useRouter();
  const [kind, setKind] = useState<GoRideKind>("now");
  const [service, setService] = useState<GoService>("ev_bike");
  const [rates, setRates] = useState<FareRate[]>(FARE_RATES);
  const [fareSource, setFareSource] = useState<"unknown" | "catalog" | "legacy">("unknown");
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
      const next = ratesFromCatalog(data as Parameters<typeof ratesFromCatalog>[0]);
      if (!next.length) {
        setFareSource("legacy");
        return;
      }
      setRates(next);
      setFareSource("catalog");
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
    const preference = `Vehicle: ${SERVICE_LABEL[service]}`;
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
    const legacyPayload = { ...payload, p_note: rideNoteWithPreference(preference, note) };
    let result =
      fareSource === "legacy"
        ? await supabase.rpc("go_request_ride", legacyPayload)
        : await supabase.rpc("go_request_ride", { ...payload, p_service: service });
    if (result.error && serviceRpcMissing(result.error.message)) {
      setFareSource("legacy");
      result = await supabase.rpc("go_request_ride", legacyPayload);
    }
    setBusy(false);
    if (result.error || !result.data) {
      setError(goErrorMessage(result.error));
      return;
    }
    router.push(`/go/ride/${String(result.data)}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-3xl border border-white/10 bg-[#1f1f24]/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="relative flex flex-col gap-3 pl-5">
          <span className="absolute bottom-6 left-[7px] top-6 w-px bg-gradient-to-b from-[#5eead4] to-[#ddb7ff]" aria-hidden="true" />
          <PlaceInput
            label="Pickup / পিকআপ"
            icon="trip_origin"
            value={pickup}
            onChange={onPickup}
            allowCurrentLocation
            autoLocate={autoLocate && !pickup}
            placeholder="Current location or landmark"
          />
          <PlaceInput
            label="Where to? / কোথায়?"
            icon="flag"
            value={drop}
            onChange={onDrop}
            placeholder="Drop-off area or place"
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
                  ? "border-transparent bg-gradient-to-br from-[#ddb7ff] to-[#a855f7] text-[#1a1a24]"
                  : "border-white/10 bg-[#121217] text-white/70"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {kind !== "now" && (
          <label className="mt-3 block">
            <span className="mb-1.5 block text-sm font-semibold text-white/70">
              {kind === "hire" ? "Start time (optional)" : "Pickup date & time"}
            </span>
            <input
              type="datetime-local"
              min={minDateTime()}
              value={when}
              onChange={(event) => setWhen(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#121217] px-4 py-3 text-white"
            />
          </label>
        )}
        {kind === "hire" && (
          <div className="mt-3 flex items-center gap-3">
            <button type="button" onClick={() => setHours((value) => Math.max(1, value - 1))} className="h-11 w-11 rounded-full border border-white/10 text-xl font-bold text-white" aria-label="Fewer hours">
              −
            </button>
            <span className="w-16 text-center text-2xl font-bold">{hours} h</span>
            <button type="button" onClick={() => setHours((value) => Math.min(12, value + 1))} className="h-11 w-11 rounded-full border border-white/10 text-xl font-bold text-white" aria-label="More hours">
              +
            </button>
          </div>
        )}
      </div>

      {pickup && <PickupSpot pickupLabel={pickup.label} onNote={onPickupNote} />}

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#e4e1e9]">Sanctuary Fleet / ফ্লিট</h2>
          <span className="text-xs font-semibold text-[#ffb95f]">100% Female Captains</span>
        </div>
        {fareSource !== "catalog" && (
          <p className="mb-2 text-xs text-white/55">
            Bike choice is saved as a preference. The charged fare is the standard rate until fleet pricing is turned on.
          </p>
        )}
        <div className="flex flex-col gap-2.5" role="listbox" aria-label="Choose a vehicle">
          {rates.map((item, index) => {
            const copy = FLEET_COPY[item.id];
            const selected = service === item.id;
            const fare =
              km != null && kind !== "hire"
                ? catalogLive
                  ? distanceFare(km, item.id, rates)
                  : legacyDistanceFare(km)
                : null;
            const pickupMin = estimatePickupMinutes(item.id, km);
            const tripMin = estimateTripMinutes(item.id, km);
            return (
              <motion.button
                key={item.id}
                type="button"
                role="option"
                aria-selected={selected}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setService(item.id)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-[#e4e1e9] ${
                  selected ? "bg-[#2a292f] ring-2 ring-[#ddb7ff]/50" : "bg-[#1f1f24]"
                }`}
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${selected ? "bg-[#ddb7ff]/20 text-[#ddb7ff]" : "bg-[#35343a] text-white/70"}`}>
                  <Icon name={item.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{copy.title}</span>
                    <span className="rounded-full bg-[#ffb95f]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ffb95f]">{copy.badge}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-white/70">
                    {pickupMin} min away
                    {tripMin != null ? ` · ${tripMin} min` : ""}
                    {" · "}
                    {copy.perk}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-extrabold text-[#ddb7ff]">{fare != null ? formatTaka(fare) : "—"}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#1f1f24] p-3 text-[#e4e1e9]">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Payment / পেমেন্ট</p>
          <p className="truncate text-sm font-semibold">{payment === "bkash" ? "bKash" : payment === "nagad" ? "Nagad" : "Cash"}</p>
        </div>
        <div className="flex shrink-0 rounded-full bg-[#2a292f] p-1">
          {(["bkash", "nagad", "cash"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPayment(method)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${payment === method ? "bg-[#ddb7ff] text-[#1a1a24]" : "text-white/70"}`}
            >
              {method === "bkash" ? "bKash" : method === "nagad" ? "Nagad" : "Cash"}
            </button>
          ))}
        </div>
      </div>

      <FareBreakdown km={kind === "hire" ? null : km} rate={selectedRate} hireFare={hireFare} hours={hours} catalogLive={catalogLive} />

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={busy || !canSubmit}
        onClick={() => void submit()}
        className="h-14 rounded-full bg-gradient-to-br from-[#ddb7ff] to-[#a855f7] text-lg font-bold text-[#1a1a24] disabled:opacity-40"
      >
        {busy ? "Requesting…" : kind === "now" ? "Request SheRides" : kind === "hire" ? "Request Hire" : "Schedule Ride"}
      </button>
      {!canSubmit && (
        <p className="text-center text-sm text-white/50">
          {pickup ? "Add destination to see fare" : "Allow location or type pickup"}
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
    <div className="relative flex h-[calc(100dvh-72px-6rem)] w-full flex-col bg-[#131318] text-[#e4e1e9] lg:grid lg:h-[calc(100dvh-72px)] lg:grid-cols-[minmax(320px,420px)_1fr]">
      <div className="absolute inset-0 z-0 lg:relative lg:order-2 lg:h-full">
        <RideMap pickup={pickup} drop={drop} />
      </div>
      <div className="relative z-10 mt-auto max-h-[78%] overflow-y-auto rounded-t-3xl border border-white/10 bg-[#131318]/95 p-4 pb-4 shadow-2xl backdrop-blur-xl lg:order-1 lg:mt-0 lg:max-h-none lg:overflow-y-auto lg:rounded-none lg:border-0 lg:bg-transparent lg:p-6 lg:pb-6 lg:shadow-none">
        {children}
        {showForm ? (
          <BookRide pickup={pickup} drop={drop} onPickup={setPickup} onDrop={setDrop} autoLocate={!initialPickup} />
        ) : null}
        {below}
      </div>
    </div>
  );
}

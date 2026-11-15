"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  RIDE_SERVICES,
  SERVICE_LABEL,
  estimateServiceFare,
  estimatePickupMinutes,
  estimateTripMinutes,
  formatTaka,
  goErrorMessage,
  roadKm,
  type GoPlace,
  type GoRideKind,
  type GoService,
} from "@/lib/go";
import { createClient } from "@/lib/supabase/client";
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
  const [service, setService] = useState<GoService>("bike");
  const [when, setWhen] = useState("");
  const [hours, setHours] = useState(2);
  const [payment, setPayment] = useState<"cash" | "bkash" | "nagad">("cash");
  const [note, setNote] = useState("");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const km = useMemo(() => (pickup && drop ? roadKm(pickup, drop) : null), [pickup, drop]);
  const fareFor = (id: GoService) =>
    kind === "hire" || km != null ? estimateServiceFare(id, kind, km, kind === "hire" ? hours : null) : null;
  const selectedFare = fareFor(service);
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
      <div className="rounded-[28px] border border-white/30 bg-surface-container-lowest/75 p-4 shadow-[0_18px_50px_-28px_rgba(88,70,220,0.55)] backdrop-blur-xl sm:p-5">
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
                  ? "border-transparent bg-accent-magenta text-white"
                  : "border-surface-border bg-surface-container-lowest/80 text-secondary"
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

      <div className="flex flex-col gap-2" role="listbox" aria-label="Choose a vehicle">
        {RIDE_SERVICES.map((item, index) => {
          const selected = service === item.id;
          const fare = fareFor(item.id);
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
              className={`flex items-center gap-3 rounded-[22px] border px-3 py-3 text-left backdrop-blur-xl transition-colors ${
                selected
                  ? "border-violet-400/80 bg-gradient-to-r from-violet-500/15 to-cyan-400/10 shadow-[0_12px_30px_-18px_rgba(108,92,231,0.9)]"
                  : "border-white/25 bg-surface-container-lowest/70"
              }`}
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white ${selected ? "bg-gradient-to-br from-[#8b7cf8] to-[#14b8c4]" : "bg-accent-magenta/80"}`}>
                <Icon name={item.icon} filled />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{item.label}</span>
                <span className="block text-sm text-secondary">
                  {item.detail}
                  {" · "}
                  {pickupMin} min away
                  {tripMin != null ? ` · ${tripMin} min trip` : ""}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-lg font-bold">{fare != null ? formatTaka(fare) : "—"}</span>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-tertiary">Est. fare</span>
              </span>
            </motion.button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setOptionsOpen((open) => !open)}
        className="self-start text-sm font-semibold text-accent-magenta"
        aria-expanded={optionsOpen}
      >
        {optionsOpen ? "Hide trip options" : "Payment and note"}
      </button>
      {optionsOpen && (
        <div className="flex flex-col gap-3 rounded-[22px] border border-white/25 bg-surface-container-lowest/70 p-4 backdrop-blur-xl">
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-secondary">Payment</span>
            <div className="flex flex-wrap gap-2">
              {(["cash", "bkash", "nagad"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPayment(method)}
                  className={`h-10 rounded-full border px-4 font-semibold capitalize ${
                    payment === method ? "border-accent-magenta bg-accent-magenta/10 text-accent-magenta" : "border-surface-border"
                  }`}
                >
                  {method === "bkash" ? "bKash" : method}
                </button>
              ))}
            </div>
            <p className="mt-1 text-sm text-tertiary">Pay your rider directly at the end of the ride.</p>
          </div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Note for your rider (gate, scarf colour)"
            className="w-full rounded-xl border border-surface-border bg-soft-off-white px-4 py-3 text-sm"
          />
        </div>
      )}

      <div className="flex items-end justify-between rounded-[22px] bg-gradient-to-br from-violet-500/15 to-cyan-400/10 px-4 py-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">{SERVICE_LABEL[service]}</p>
          <p className="text-3xl font-bold leading-tight">{selectedFare != null ? formatTaka(selectedFare) : "—"}</p>
          {km != null && kind !== "hire" && <p className="text-sm text-tertiary">about {km.toFixed(1)} km</p>}
        </div>
        <p className="max-w-[140px] text-right text-sm text-secondary">Women riders only. An admin checks every rider.</p>
      </div>

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={busy || !canSubmit}
        onClick={() => void submit()}
        className="h-14 rounded-full bg-accent-magenta text-lg font-semibold text-white"
      >
        {busy ? "Requesting…" : kind === "now" ? "Request Ride" : kind === "hire" ? "Request hire" : "Schedule ride"}
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
    <div className="flex w-full min-w-0 flex-col lg:grid lg:grid-cols-[minmax(300px,440px)_minmax(0,1fr)] lg:items-start">
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

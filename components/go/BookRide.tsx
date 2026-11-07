"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { estimateFare, formatTaka, goErrorMessage, roadKm, type GoPlace, type GoRideKind } from "@/lib/go";
import { createClient } from "@/lib/supabase/client";
import { PlaceInput } from "./PlaceInput";

const KINDS: { id: GoRideKind; icon: string; title: string; sub: string }[] = [
  { id: "now", icon: "bolt", title: "Ride now", sub: "Nearest online rider" },
  { id: "scheduled", icon: "event", title: "Pre-book", sub: "Pick a date & time" },
  { id: "hire", icon: "schedule", title: "Hire", sub: "By the hour" },
];

function minDateTime() {
  const d = new Date(Date.now() + 20 * 60 * 1000);
  d.setSeconds(0, 0);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function BookRide() {
  const router = useRouter();
  const [kind, setKind] = useState<GoRideKind>("now");
  const [pickup, setPickup] = useState<GoPlace | null>(null);
  const [drop, setDrop] = useState<GoPlace | null>(null);
  const [when, setWhen] = useState("");
  const [hours, setHours] = useState(2);
  const [payment, setPayment] = useState<"cash" | "bkash" | "nagad">("cash");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const km = useMemo(() => (pickup && drop ? roadKm(pickup, drop) : null), [pickup, drop]);
  const fare = kind === "hire" ? estimateFare("hire", null, hours) : km != null ? estimateFare(kind, km, null) : null;
  const canSubmit =
    Boolean(pickup) &&
    (kind === "hire" || Boolean(drop)) &&
    (kind !== "scheduled" || Boolean(when));

  async function submit() {
    setError(null);
    if (!pickup) return setError("Choose your pickup point from the suggestions.");
    if (kind !== "hire" && !drop) return setError("Choose your drop-off point from the suggestions.");
    if (kind === "scheduled" && !when) return setError("Choose a pickup date and time.");
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    const { data, error: rpcError } = await supabase.rpc("go_request_ride", {
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
    });
    setBusy(false);
    if (rpcError || !data) {
      setError(goErrorMessage(rpcError));
      return;
    }
    router.push(`/go/ride/${String(data)}`);
  }

  return (
    <div className="card-surface p-6 flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={`rounded-2xl p-3 text-left border transition-all ${
              kind === k.id
                ? "border-accent-magenta bg-accent-magenta/10 shadow-magenta"
                : "border-surface-border hover:border-accent-magenta/50"
            }`}
          >
            <Icon name={k.icon} filled={kind === k.id} className="text-accent-magenta" />
            <p className="font-label-lg mt-1">{k.title}</p>
            <p className="font-body-sm text-tertiary text-[12px] leading-tight">{k.sub}</p>
          </button>
        ))}
      </div>

      <PlaceInput label="Pickup" icon="trip_origin" value={pickup} onChange={setPickup} allowCurrentLocation />
      <PlaceInput
        label={kind === "hire" ? "Main destination (optional)" : "Drop-off"}
        icon="flag"
        value={drop}
        onChange={setDrop}
      />

      {kind !== "now" && (
        <label className="block">
          <span className="mb-1.5 block font-label-lg text-secondary">
            {kind === "hire" ? "Start time (leave empty for as soon as possible)" : "Pickup date & time"}
          </span>
          <input
            type="datetime-local"
            min={minDateTime()}
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="w-full bg-soft-off-white border border-surface-border rounded-xl px-4 py-3"
          />
        </label>
      )}

      {kind === "hire" && (
        <label className="block">
          <span className="mb-1.5 block font-label-lg text-secondary">How many hours?</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setHours((h) => Math.max(1, h - 1))} className="w-11 h-11 rounded-full border border-surface-border font-bold text-xl">
              −
            </button>
            <span className="font-headline-md text-[24px] w-16 text-center">{hours} h</span>
            <button type="button" onClick={() => setHours((h) => Math.min(12, h + 1))} className="w-11 h-11 rounded-full border border-surface-border font-bold text-xl">
              +
            </button>
          </div>
        </label>
      )}

      <div>
        <span className="mb-1.5 block font-label-lg text-secondary">Payment</span>
        <div className="flex gap-2">
          {(["cash", "bkash", "nagad"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPayment(p)}
              className={`px-4 h-10 rounded-full border font-label-lg capitalize ${
                payment === p ? "border-accent-magenta bg-accent-magenta/10 text-accent-magenta" : "border-surface-border"
              }`}
            >
              {p === "bkash" ? "bKash" : p}
            </button>
          ))}
        </div>
        <p className="mt-1 font-body-sm text-tertiary">Pay your rider directly at the end of the ride.</p>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={300}
        rows={2}
        placeholder="Note for rider (e.g. I'm at the gate, wearing a blue scarf)"
        className="w-full bg-soft-off-white border border-surface-border rounded-xl px-4 py-3 font-body-sm"
      />

      <div className="rounded-2xl bg-gradient-to-br from-accent-magenta/10 to-purple-500/10 p-4 flex items-center justify-between">
        <div>
          <p className="font-label-caps text-label-caps text-tertiary">ESTIMATED FARE</p>
          <p className="font-display-lg text-[30px] leading-tight font-bold">{fare != null ? formatTaka(fare) : "—"}</p>
          {km != null && kind !== "hire" && <p className="font-body-sm text-tertiary">about {km.toFixed(1)} km</p>}
        </div>
        <Icon name="two_wheeler" className="text-accent-magenta text-[40px]" />
      </div>

      {error && (
        <p className="font-body-sm text-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={busy || !canSubmit}
        onClick={() => void submit()}
        className="h-14 rounded-full bg-accent-magenta text-white font-label-lg inline-flex items-center justify-center gap-2"
      >
        <Icon name={kind === "now" ? "bolt" : "event_available"} />
        {busy ? "Sending…" : kind === "now" ? "Find a rider" : kind === "hire" ? "Request hire" : "Pre-book ride"}
      </button>
    </div>
  );
}

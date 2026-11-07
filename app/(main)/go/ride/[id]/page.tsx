"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { BackLink } from "@/components/ui/BackLink";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import { requestRiderLocation } from "@/lib/geolocation";
import {
  KIND_LABEL,
  RIDE_STATUS_LABEL,
  directionsLink,
  formatTaka,
  formatWhen,
  goErrorMessage,
  mapsLink,
  roadKm,
  type GoRide,
} from "@/lib/go";
import { createClient } from "@/lib/supabase/client";

type RiderCard = { full_name: string; avatar_url: string | null; bike_model: string; bike_plate: string; rating: number | null; completed_rides: number };
type Person = { full_name: string; avatar_url: string | null };

const STEPS = ["requested", "accepted", "in_progress", "completed"] as const;

export default function GoRidePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [ride, setRide] = useState<GoRide | null>(null);
  const [rider, setRider] = useState<RiderCard | null>(null);
  const [passenger, setPassenger] = useState<Person | null>(null);
  const [secret, setSecret] = useState<{ pin: string; share_token: string } | null>(null);
  const [pin, setPin] = useState("");
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isPassenger = Boolean(ride && user && ride.passenger_id === user.id);
  const isRider = Boolean(ride && user && ride.rider_id === user.id);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase || !id) return;
    const { data, error } = await supabase.from("go_rides").select("*").eq("id", id).maybeSingle();
    if (error || !data) {
      setLoadError(error ? goErrorMessage(error) : "Ride not found.");
      return;
    }
    const row = data as GoRide;
    setRide(row);
    if (row.rider_id) {
      const { data: card } = await supabase.rpc("go_rider_card", { p_ride_id: row.id });
      setRider(((card ?? []) as RiderCard[])[0] ?? null);
    } else {
      setRider(null);
    }
    const { data: p } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", row.passenger_id).maybeSingle();
    setPassenger((p as Person | null) ?? null);
    if (user && row.passenger_id === user.id) {
      const { data: s } = await supabase.from("go_ride_secrets").select("pin, share_token").eq("ride_id", row.id).maybeSingle();
      setSecret((s as { pin: string; share_token: string } | null) ?? null);
    }
  }, [id, user]);

  useEffect(() => {
    void load();
    const supabase = createClient();
    if (!supabase || !id) return;
    const channel = supabase
      .channel(`go-ride:${id}:${Math.random().toString(36).slice(2, 10)}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "go_rides", filter: `id=eq.${id}` }, () => void load())
      .subscribe();
    const poll = window.setInterval(() => void load(), 15000);
    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [id, load]);

  // The rider's phone reports her position while she has this ride open.
  useEffect(() => {
    if (!isRider || !ride || !["accepted", "in_progress"].includes(ride.status)) return;
    const beat = async () => {
      const supabase = createClient();
      if (!supabase) return;
      try {
        const pos = await requestRiderLocation();
        await supabase.rpc("go_set_online", { p_online: null, p_lat: pos.coords.latitude, p_lng: pos.coords.longitude });
      } catch {
        /* location off: passenger simply sees the last known position */
      }
    };
    void beat();
    const timer = window.setInterval(() => void beat(), 15000);
    return () => window.clearInterval(timer);
  }, [isRider, ride]);

  async function call(fn: string, args: Record<string, unknown>, done?: string) {
    const supabase = createClient();
    if (!supabase) return false;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.rpc(fn, args);
    setBusy(false);
    if (error) {
      setMessage(goErrorMessage(error));
      return false;
    }
    if (done) setMessage(done);
    await load();
    return true;
  }

  async function sos() {
    if (!ride) return;
    let lat: number | null = null;
    let lng: number | null = null;
    try {
      const pos = await requestRiderLocation();
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      /* send without location */
    }
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.rpc("submit_emergency_alert", {
      p_problem_type: "harassment",
      p_note: `SheRides ride ${ride.id.slice(0, 8)} — ${ride.pickup_text} → ${ride.drop_text ?? "hire"}`,
      p_latitude: lat,
      p_longitude: lng,
    });
    setMessage(error ? goErrorMessage(error) : "SOS sent. Admins have your location and ride details.");
  }

  async function shareTrip() {
    if (!secret) return;
    const url = `${window.location.origin}/track/${secret.share_token}`;
    const text = "Follow my SheRides ride live:";
    try {
      if (navigator.share) {
        await navigator.share({ title: "My SheRides ride", text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMessage("Trip link copied. Send it to your family on WhatsApp or SMS.");
    } catch {
      /* user closed the share sheet */
    }
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto px-container-margin-mobile py-10">
        <BackLink href="/go" label="Book a Ride" className="mb-4" />
        <p className="card-surface p-6 font-body-sm text-error">{loadError}</p>
      </div>
    );
  }
  if (!ride) return <div className="max-w-xl mx-auto px-container-margin-mobile py-10"><div className="skeleton h-80" /></div>;

  const stepIndex = ride.status === "cancelled" ? -1 : STEPS.indexOf(ride.status as (typeof STEPS)[number]);
  const riderAway =
    ride.rider_lat != null && ride.rider_lng != null && ride.pickup_lat != null && ride.pickup_lng != null
      ? roadKm({ lat: ride.rider_lat, lng: ride.rider_lng }, { lat: ride.pickup_lat, lng: ride.pickup_lng })
      : null;
  const otherId = isPassenger ? ride.rider_id : ride.passenger_id;
  const active = ride.status === "accepted" || ride.status === "in_progress";
  const alreadyRated = isPassenger ? ride.rider_rating != null : ride.passenger_rating != null;

  return (
    <div className="w-full max-w-xl mx-auto px-container-margin-mobile lg:px-0 py-8 flex flex-col gap-5">
      <BackLink href={isRider ? "/go?tab=rider" : "/go"} label="Book a Ride" />

      <header className="rounded-[24px] p-6 text-white bg-gradient-to-br from-[#4a1530] via-[#a3195b] to-[#c45c2a] shadow-xl">
        <p className="font-label-caps text-label-caps opacity-80">{KIND_LABEL[ride.kind].toUpperCase()} · {ride.kind === "now" ? "NOW" : formatWhen(ride.scheduled_at)}</p>
        <h1 className="font-display-lg text-[30px] font-bold leading-tight mt-1 flex items-center gap-2">
          {ride.status === "requested" && <span className="w-3 h-3 rounded-full bg-white animate-pulse" />}
          {RIDE_STATUS_LABEL[ride.status]}
        </h1>
        <p className="font-headline-md text-[22px] mt-1">{formatTaka(ride.fare)} · {ride.payment_method === "bkash" ? "bKash" : ride.payment_method === "nagad" ? "Nagad" : "Cash"}</p>
        {stepIndex >= 0 && (
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {STEPS.map((step, i) => (
              <span key={step} className={`h-1.5 rounded-full ${i <= stepIndex ? "bg-white" : "bg-white/25"}`} />
            ))}
          </div>
        )}
      </header>

      {isPassenger && secret && active && (
        <div className="card-surface p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="font-label-caps text-label-caps text-tertiary">YOUR RIDE PIN</p>
            <p className="font-display-lg text-[40px] tracking-[0.3em] font-bold text-accent-magenta">{secret.pin}</p>
            <p className="font-body-sm text-secondary">Tell this to your rider only after you see her face and number plate.</p>
          </div>
          <Icon name="pin" className="text-accent-magenta text-[40px]" />
        </div>
      )}

      {rider && (isPassenger || ride.status !== "requested") && (
        <div className="card-surface p-5 flex items-center gap-4">
          <span className="avatar-ring w-14 h-14 rounded-full overflow-hidden shrink-0">
            <Avatar src={rider.avatar_url} alt={rider.full_name} size={56} className="w-full h-full" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-label-lg flex items-center gap-1">{rider.full_name} <Icon name="verified" filled size={18} className="text-accent-magenta" /></p>
            <p className="font-body-sm text-secondary">{rider.bike_model} · <span className="font-bold">{rider.bike_plate}</span></p>
            <p className="font-body-sm text-tertiary">{rider.rating != null ? `★ ${rider.rating}` : "New rider"} · {rider.completed_rides} rides</p>
          </div>
        </div>
      )}

      {isRider && passenger && (
        <div className="card-surface p-5 flex items-center gap-4">
          <span className="avatar-ring w-14 h-14 rounded-full overflow-hidden shrink-0">
            <Avatar src={passenger.avatar_url} alt={passenger.full_name} size={56} className="w-full h-full" />
          </span>
          <div className="flex-1">
            <p className="font-label-caps text-label-caps text-tertiary">PASSENGER</p>
            <p className="font-label-lg">{passenger.full_name}</p>
          </div>
        </div>
      )}

      <div className="card-surface p-5 flex flex-col gap-3 font-body-sm">
        <div className="flex gap-3 items-start">
          <Icon name="trip_origin" className="text-green-600" />
          <div className="flex-1">
            <p>{ride.pickup_text}</p>
            {isRider && ride.pickup_lat != null && ride.pickup_lng != null && ride.status === "accepted" && (
              <a href={directionsLink(null, { lat: ride.pickup_lat, lng: ride.pickup_lng })} target="_blank" rel="noreferrer" className="text-accent-magenta font-label-lg">Navigate to pickup →</a>
            )}
          </div>
        </div>
        {ride.drop_text && (
          <div className="flex gap-3 items-start">
            <Icon name="flag" className="text-accent-magenta" />
            <div className="flex-1">
              <p>{ride.drop_text}{ride.distance_km ? ` · ${Number(ride.distance_km).toFixed(1)} km` : ""}</p>
              {isRider && ride.drop_lat != null && ride.drop_lng != null && ride.status === "in_progress" && (
                <a href={directionsLink(null, { lat: ride.drop_lat, lng: ride.drop_lng })} target="_blank" rel="noreferrer" className="text-accent-magenta font-label-lg">Navigate to drop-off →</a>
              )}
            </div>
          </div>
        )}
        {ride.kind === "hire" && ride.hire_hours && <p className="flex gap-3"><Icon name="schedule" className="text-accent-magenta" />{ride.hire_hours} hour hire</p>}
        {ride.note && <p className="flex gap-3 text-secondary"><Icon name="sticky_note_2" />{ride.note}</p>}
        {isPassenger && ride.rider_lat != null && ride.rider_lng != null && active && (
          <a href={mapsLink(ride.rider_lat, ride.rider_lng)} target="_blank" rel="noreferrer" className="flex gap-3 text-accent-magenta font-label-lg">
            <Icon name="near_me" />
            See rider on map{riderAway != null && ride.status === "accepted" ? ` · ${riderAway.toFixed(1)} km away` : ""}
          </a>
        )}
      </div>

      {active && (
        <div className="grid grid-cols-3 gap-3">
          {isPassenger && (
            <button type="button" onClick={() => void shareTrip()} className="card-surface p-3 flex flex-col items-center gap-1 font-label-lg text-sm">
              <Icon name="share_location" className="text-accent-magenta" /> Share trip
            </button>
          )}
          {otherId && (
            <Link href={`/messages?to=${otherId}`} className="card-surface p-3 flex flex-col items-center gap-1 font-label-lg text-sm">
              <Icon name="chat" className="text-accent-magenta" /> Message
            </Link>
          )}
          <button type="button" onClick={() => void sos()} className="rounded-[20px] p-3 flex flex-col items-center gap-1 font-label-lg text-sm bg-red-600 text-white shadow-lg">
            <Icon name="emergency" filled /> SOS
          </button>
        </div>
      )}

      {isRider && ride.status === "accepted" && (
        <div className="card-surface p-5 flex flex-col gap-3">
          <p className="font-label-lg">Reached the passenger? Ask for her 4-digit PIN.</p>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder="• • • •"
            className="w-full text-center tracking-[0.5em] font-display-lg text-[28px] bg-soft-off-white border border-surface-border rounded-xl py-3"
          />
          <button type="button" disabled={busy || pin.length !== 4} onClick={() => void call("go_start_ride", { p_ride_id: ride.id, p_pin: pin })} className="h-12 rounded-full bg-accent-magenta text-white font-label-lg">
            Start ride
          </button>
        </div>
      )}

      {isRider && ride.status === "in_progress" && (
        <button type="button" disabled={busy} onClick={() => void call("go_complete_ride", { p_ride_id: ride.id }, `Ride complete. Collect ${formatTaka(ride.fare)}.`)} className="h-14 rounded-full bg-accent-magenta text-white font-label-lg">
          Complete ride · collect {formatTaka(ride.fare)}
        </button>
      )}

      {ride.status === "completed" && (isPassenger || isRider) && !alreadyRated && (
        <div className="card-surface p-5 flex flex-col gap-3">
          <p className="font-label-lg">Rate your {isPassenger ? "rider" : "passenger"}</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setStars(n)} aria-label={`${n} stars`}>
                <Icon name="star" filled={n <= stars} className={`text-[36px] ${n <= stars ? "text-amber-400" : "text-surface-variant"}`} />
              </button>
            ))}
          </div>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={500} rows={2} placeholder={stars && stars <= 2 ? "What went wrong? Admins will review this." : "Anything to add? (optional)"} className="w-full bg-soft-off-white border border-surface-border rounded-xl px-4 py-3 font-body-sm" />
          <button type="button" disabled={busy || !stars} onClick={() => void call("go_rate_ride", { p_ride_id: ride.id, p_stars: stars, p_feedback: feedback }, "Thank you for rating!")} className="h-12 rounded-full bg-accent-magenta text-white font-label-lg">
            Submit rating
          </button>
        </div>
      )}

      {(ride.status === "requested" || ride.status === "accepted") && (isPassenger || isRider) && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            const ok = await call("go_cancel_ride", { p_ride_id: ride.id, p_reason: isRider ? "Rider backed out" : "Passenger cancelled" });
            if (ok && isRider) router.push("/go?tab=rider");
          }}
          className="h-12 rounded-full border border-error text-error font-label-lg"
        >
          {isRider ? "Can't make it — release this ride" : "Cancel ride"}
        </button>
      )}

      {message && <p className="card-surface p-4 font-body-sm" role="status">{message}</p>}
    </div>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { BackLink } from "@/components/ui/BackLink";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import {
  KIND_LABEL,
  RIDE_STATUS_LABEL,
  serviceLabel,
  directionsLink,
  formatTaka,
  formatWhen,
  goErrorMessage,
  mapsLink,
  roadKm,
  type GoRide,
} from "@/lib/go";
import { createClient } from "@/lib/supabase/client";
import { FavouriteCaptain } from "@/components/go/FavouriteCaptain";
import { LiveRideBoard, RideRating } from "@/components/go/RideFollowup";
import { RideChat } from "@/components/go/RideChat";
import { RideReceipt } from "@/components/go/RideReceipt";
import { useDriverLocationSender } from "@/hooks/useDriverLocationSender";
import { useRideTracking } from "@/hooks/useRideTracking";

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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stops, setStops] = useState<{ id: string; label: string }[]>([]);

  const isPassenger = Boolean(ride && user && ride.passenger_id === user.id);
  const isRider = Boolean(ride && user && ride.rider_id === user.id);

  const load = useCallback(async () => {
    if (!id) return;
    const supabase = createClient();
    if (!supabase) {
      setLoadError("Ride booking is not connected yet.");
      return;
    }
    const { data, error } = await supabase.from("go_rides").select("*").eq("id", id).maybeSingle();
    if (error || !data) {
      setLoadError(error ? goErrorMessage(error) : "Ride not found.");
      return;
    }
    setLoadError(null);
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
    const stopsResult = await supabase.from("go_ride_stops").select("id, label, position").eq("ride_id", row.id).order("position");
    setStops(stopsResult.error ? [] : ((stopsResult.data ?? []) as { id: string; label: string }[]));
    if (user && row.passenger_id === user.id) {
      const { data: s } = await supabase.from("go_ride_secrets").select("pin, share_token").eq("ride_id", row.id).maybeSingle();
      setSecret((s as { pin: string; share_token: string } | null) ?? null);
    }
  }, [id, user]);

  useEffect(() => {
    void load();
    // Realtime is handled by useRideTracking; this slow poll is only a safety net.
    const poll = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(poll);
  }, [load]);

  // Live ride updates (status + rider position) through Supabase Realtime.
  const live = useRideTracking(id);
  const rideStatus = ride?.status;
  useEffect(() => {
    // Status changed (accepted / started / completed / cancelled) → reload full details.
    if (live.status && rideStatus && live.status !== rideStatus) void load();
  }, [live.status, rideStatus, load]);
  useEffect(() => {
    const pos = live.position;
    if (!pos) return;
    setRide((prev) =>
      prev && (prev.rider_lat !== pos.lat || prev.rider_lng !== pos.lng || prev.rider_seen_at !== pos.seenAt)
        ? { ...prev, rider_lat: pos.lat, rider_lng: pos.lng, rider_seen_at: pos.seenAt }
        : prev
    );
  }, [live.position]);

  // The rider's phone streams her position (~every 4 s) while the ride is active.
  const gps = useDriverLocationSender(
    isRider && (rideStatus === "accepted" || rideStatus === "in_progress")
  );

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

  async function shareTrip() {
    if (!secret) {
      setMessage("The trip link is not ready yet. Wait a moment and try again.");
      return;
    }
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
  const active = ride.status === "accepted" || ride.status === "in_progress";
  const alreadyRated = isPassenger ? ride.rider_rating != null : ride.passenger_rating != null;

  return (
    <div className="w-full max-w-xl mx-auto px-container-margin-mobile lg:px-0 py-8 flex flex-col gap-5">
      <BackLink href={isRider ? "/go?tab=rider" : "/go"} label="Book a Ride" />

      <header className="rounded-[24px] p-6 text-white bg-gradient-to-br from-[#14163a] via-[#4c45c4] to-[#16708a] shadow-xl">
        <p className="font-label-caps text-label-caps opacity-80">{KIND_LABEL[ride.kind].toUpperCase()} · {ride.kind === "now" ? "NOW" : formatWhen(ride.scheduled_at)}</p>
        <h1 className="font-display-lg text-[30px] font-bold leading-tight mt-1 flex items-center gap-2">
          {ride.status === "requested" && <span className="w-3 h-3 rounded-full bg-white animate-pulse" />}
          {RIDE_STATUS_LABEL[ride.status]}
        </h1>
        <p className="font-headline-md text-[22px] mt-1">{formatTaka(ride.fare)} · {ride.payment_method === "bkash" ? "bKash" : ride.payment_method === "nagad" ? "Nagad" : "Cash"}{serviceLabel(ride.service) ? ` · ${serviceLabel(ride.service)}` : ""}</p>
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
          {isPassenger && ride.rider_id && <FavouriteCaptain riderId={ride.rider_id} name={rider.full_name} />}
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
        {stops.map((stop) => (
          <p key={stop.id} className="flex gap-3"><Icon name="add_location_alt" className="text-[#ffb95f]" />Stop · {stop.label}</p>
        ))}
        {ride.kind === "hire" && ride.hire_hours && <p className="flex gap-3"><Icon name="schedule" className="text-accent-magenta" />{ride.hire_hours} hour hire</p>}
        {ride.note && <p className="flex gap-3 text-secondary"><Icon name="sticky_note_2" />{ride.note}</p>}
        {isPassenger && ride.rider_lat != null && ride.rider_lng != null && active && (
          <a href={mapsLink(ride.rider_lat, ride.rider_lng)} target="_blank" rel="noreferrer" className="flex gap-3 text-accent-magenta font-label-lg">
            <Icon name="near_me" />
            See rider on map{riderAway != null && ride.status === "accepted" ? ` · ${riderAway.toFixed(1)} km away` : ""}
            {live.isStale && <span className="text-secondary font-body-sm"> · signal weak</span>}
          </a>
        )}
        {isRider && active && (
          <p className={`flex gap-3 font-body-sm ${gps.error ? "text-error" : "text-secondary"}`} role="status">
            <Icon name={gps.status === "tracking" ? "my_location" : "location_disabled"} />
            {gps.error ?? (gps.status === "tracking" ? "Sharing live location with the passenger" : "Starting live location…")}
          </p>
        )}
      </div>

      {user && ride.rider_id && (isPassenger || isRider) && (
        <RideChat
          rideId={ride.id}
          myId={user.id}
          role={isRider ? "rider" : "passenger"}
          otherName={(isRider ? passenger?.full_name : rider?.full_name)?.split(" ")[0] ?? (isRider ? "passenger" : "rider")}
          canSend={ride.status === "accepted" || ride.status === "in_progress"}
        />
      )}

      {ride.status === "in_progress" && (
        <LiveRideBoard
          pickup={ride.pickup_text}
          drop={ride.drop_text}
          fleet={serviceLabel(ride.service)}
          captain={
            rider
              ? {
                  name: rider.full_name,
                  bike: rider.bike_model,
                  plate: rider.bike_plate,
                  rating: rider.rating != null ? `★ ${rider.rating}` : "New captain — rating not earned yet",
                  rides: `${rider.completed_rides} completed rides on record`,
                }
              : null
          }
          positionLabel={
            ride.rider_lat != null && ride.rider_lng != null
              ? `Last shared position ${ride.rider_lat.toFixed(5)}, ${ride.rider_lng.toFixed(5)}${ride.rider_seen_at ? ` · ${formatWhen(ride.rider_seen_at)}` : ""}`
              : null
          }
        />
      )}

      {active && isPassenger && (
        <button type="button" onClick={() => void shareTrip()} className="btn btn-secondary w-full">
          <Icon name="share_location" className="text-[#ddb7ff]" /> Share trip
        </button>
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
          <button type="button" disabled={busy || pin.length !== 4} aria-busy={busy} onClick={() => void call("go_start_ride", { p_ride_id: ride.id, p_pin: pin })} className="btn btn-primary w-full">
            {busy ? "Starting…" : "Start ride"}
          </button>
        </div>
      )}

      {isRider && ride.status === "in_progress" && (
        <button type="button" disabled={busy} aria-busy={busy} onClick={() => void call("go_complete_ride", { p_ride_id: ride.id }, `Ride complete. Collect ${formatTaka(ride.fare)}.`)} className="btn btn-primary h-14 w-full text-lg">
          {busy ? "Completing…" : `Complete ride · collect ${formatTaka(ride.fare)}`}
        </button>
      )}

      {ride.status === "completed" && (isPassenger || isRider) && !alreadyRated && (
        <RideRating
          personName={(isPassenger ? rider?.full_name : passenger?.full_name) ?? (isPassenger ? "your captain" : "your passenger")}
          busy={busy}
          onSubmit={(stars, feedback) => void call("go_rate_ride", { p_ride_id: ride.id, p_stars: stars, p_feedback: feedback }, "Thank you for rating!")}
        />
      )}

      {ride.status === "completed" && (
        <RideReceipt ride={ride} passengerName={passenger?.full_name ?? null} riderName={rider?.full_name ?? null} />
      )}

      {(ride.status === "requested" || ride.status === "accepted") && (isPassenger || isRider) && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            const ok = await call("go_cancel_ride", { p_ride_id: ride.id, p_reason: isRider ? "Rider backed out" : "Passenger cancelled" });
            if (ok && isRider) router.push("/go?tab=rider");
          }}
          className="btn btn-danger w-full"
        >
          {isRider ? "Can't make it — release this ride" : "Cancel ride"}
        </button>
      )}

      {message && <p className="card-surface p-4 font-body-sm" role="status">{message}</p>}
    </div>
  );
}

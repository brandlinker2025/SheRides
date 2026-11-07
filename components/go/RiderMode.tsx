"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import { locationErrorMessage, requestRiderLocation } from "@/lib/geolocation";
import {
  KIND_LABEL,
  RIDE_STATUS_LABEL,
  formatTaka,
  formatWhen,
  goErrorMessage,
  roadKm,
  type GoRide,
} from "@/lib/go";
import { createClient } from "@/lib/supabase/client";

type RideWithPassenger = GoRide & { passenger: { full_name: string; avatar_url: string | null } | null };
const SELECT = "*, passenger:profiles!go_rides_passenger_id_fkey(full_name, avatar_url)";

export function RiderMode() {
  const router = useRouter();
  const { user } = useAuth();
  const [online, setOnline] = useState(false);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [open, setOpen] = useState<RideWithPassenger[]>([]);
  const [mine, setMine] = useState<RideWithPassenger[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const heartbeat = useRef<number | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase || !user) return;
    const [{ data: openRows }, { data: mineRows }, { data: state }] = await Promise.all([
      supabase.from("go_rides").select(SELECT).eq("status", "requested").is("rider_id", null).order("created_at", { ascending: false }).limit(30),
      supabase.from("go_rides").select(SELECT).eq("rider_id", user.id).in("status", ["accepted", "in_progress"]).order("scheduled_at", { ascending: true, nullsFirst: true }),
      supabase.from("go_rider_state").select("is_online").eq("user_id", user.id).maybeSingle(),
    ]);
    setOpen(((openRows ?? []) as RideWithPassenger[]).filter((r) => r.passenger_id !== user.id));
    setMine((mineRows ?? []) as RideWithPassenger[]);
    if (state) setOnline(Boolean(state.is_online));
  }, [user]);

  useEffect(() => {
    void load();
    const supabase = createClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`go-rider-board:${Math.random().toString(36).slice(2, 10)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "go_rides" }, () => void load())
      .subscribe();
    const poll = window.setInterval(() => void load(), 20000);
    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const sendBeat = useCallback(async (isOnline: boolean) => {
    const supabase = createClient();
    if (!supabase) return;
    let lat: number | null = null;
    let lng: number | null = null;
    try {
      const pos = await requestRiderLocation();
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      setMe({ lat, lng });
    } catch (err) {
      if (isOnline) setMessage(locationErrorMessage(err));
    }
    const { error } = await supabase.rpc("go_set_online", { p_online: isOnline, p_lat: lat, p_lng: lng });
    if (error) setMessage(goErrorMessage(error));
  }, []);

  // While online (or on an active ride) send location every 20 seconds so passengers can track.
  useEffect(() => {
    const active = online || mine.length > 0;
    if (!active) return;
    void sendBeat(online);
    heartbeat.current = window.setInterval(() => void sendBeat(online), 20000);
    return () => {
      if (heartbeat.current) window.clearInterval(heartbeat.current);
    };
  }, [online, mine.length, sendBeat]);

  async function toggle() {
    setMessage(null);
    const next = !online;
    setOnline(next);
    await sendBeat(next);
  }

  async function accept(ride: GoRide) {
    const supabase = createClient();
    if (!supabase) return;
    setBusyId(ride.id);
    setMessage(null);
    const { error } = await supabase.rpc("go_accept_ride", { p_ride_id: ride.id });
    setBusyId(null);
    if (error) {
      setMessage(goErrorMessage(error));
      void load();
      return;
    }
    router.push(`/go/ride/${ride.id}`);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card-surface p-6 flex items-center gap-5">
        <button
          type="button"
          onClick={() => void toggle()}
          aria-pressed={online}
          className={`relative w-20 h-11 rounded-full transition-colors shrink-0 ${online ? "bg-green-600" : "bg-surface-container-high"}`}
        >
          <span className={`absolute top-1 w-9 h-9 rounded-full bg-white shadow transition-all ${online ? "left-10" : "left-1"}`} />
        </button>
        <div>
          <p className="font-headline-md text-[20px] font-bold">{online ? "You are online" : "You are offline"}</p>
          <p className="font-body-sm text-secondary">
            {online ? "Keep this page open to receive ride-now requests near you." : "Go online to receive ride-now requests. Pre-bookings show below anytime."}
          </p>
        </div>
      </div>
      {message && <p className="font-body-sm text-error">{message}</p>}

      {mine.length > 0 && (
        <section>
          <h3 className="font-headline-md text-[18px] font-bold mb-3">Your active rides</h3>
          <div className="flex flex-col gap-3">
            {mine.map((ride) => (
              <Link key={ride.id} href={`/go/ride/${ride.id}`} className="card-surface card-hover p-4 flex items-center gap-3">
                <Icon name="two_wheeler" className="text-accent-magenta" />
                <div className="flex-1 min-w-0">
                  <p className="font-label-lg truncate">{ride.passenger?.full_name ?? "Passenger"} · {RIDE_STATUS_LABEL[ride.status]}</p>
                  <p className="font-body-sm text-tertiary truncate">{ride.pickup_text}</p>
                </div>
                <Icon name="chevron_right" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="font-headline-md text-[18px] font-bold mb-3">Open requests</h3>
        {open.length === 0 ? (
          <p className="card-surface p-6 font-body-sm text-secondary text-center">No open requests right now.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {open.map((ride) => {
              const away = me && ride.pickup_lat != null && ride.pickup_lng != null ? roadKm(me, { lat: ride.pickup_lat, lng: ride.pickup_lng }) : null;
              return (
                <article key={ride.id} className="card-surface p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="avatar-ring w-11 h-11 rounded-full overflow-hidden shrink-0">
                      <Avatar src={ride.passenger?.avatar_url} alt={ride.passenger?.full_name ?? "Passenger"} size={44} className="w-full h-full" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-label-lg truncate">{ride.passenger?.full_name ?? "Passenger"}</p>
                      <p className="font-body-sm text-tertiary">
                        {KIND_LABEL[ride.kind]} · {ride.kind === "now" ? "Now" : formatWhen(ride.scheduled_at)}
                        {ride.kind === "hire" && ride.hire_hours ? ` · ${ride.hire_hours} h` : ""}
                      </p>
                    </div>
                    <p className="font-headline-md text-[20px] font-bold text-accent-magenta">{formatTaka(ride.fare)}</p>
                  </div>
                  <div className="font-body-sm flex flex-col gap-1">
                    <p className="flex gap-2"><Icon name="trip_origin" size={18} className="text-green-600" />{ride.pickup_text}{away != null ? ` · ${away.toFixed(1)} km from you` : ""}</p>
                    {ride.drop_text && <p className="flex gap-2"><Icon name="flag" size={18} className="text-accent-magenta" />{ride.drop_text}{ride.distance_km ? ` · ${Number(ride.distance_km).toFixed(1)} km trip` : ""}</p>}
                    {ride.note && <p className="text-secondary italic">“{ride.note}”</p>}
                  </div>
                  <button
                    type="button"
                    disabled={busyId === ride.id}
                    onClick={() => void accept(ride)}
                    className="h-12 rounded-full bg-accent-magenta text-white font-label-lg"
                  >
                    {busyId === ride.id ? "Accepting…" : "Accept ride"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

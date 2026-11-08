"use client";

/**
 * SheRides ride — passenger live tracking.
 *
 * Listens to one ride row (go_rides) through Supabase Realtime. Row Level
 * Security means only the passenger, the rider and admins receive updates.
 * Returns plain coordinates — the page/map turns them into the moving marker.
 *
 * Usage:
 *   const live = useRideTracking(rideId);
 *   live.position → { lat, lng, seenAt } | null
 *   live.status   → "requested" | "accepted" | "in_progress" | ...
 *   live.isStale  → true when no GPS for 60 s (show "signal weak")
 */
import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { GoRideStatus } from "@/lib/go";
import { createClient } from "@/lib/supabase/client";
import { getRideLiveSnapshot, toPosition, type RideLivePosition } from "@/services/goLocationService";

const STALE_AFTER_MS = 60_000;

export type RideTrackingState = {
  position: RideLivePosition | null;
  status: GoRideStatus | null;
  connected: boolean;
  isStale: boolean;
  error: string | null;
};

type RideRow = {
  status?: GoRideStatus;
  rider_lat?: number | null;
  rider_lng?: number | null;
  rider_seen_at?: string | null;
};

export function useRideTracking(rideId: string | null | undefined): RideTrackingState {
  const [position, setPosition] = useState<RideLivePosition | null>(null);
  const [status, setStatus] = useState<GoRideStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!rideId) return;
    const supabase = createClient();
    if (!supabase) return;

    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    const loadSnapshot = async () => {
      try {
        const snap = await getRideLiveSnapshot(rideId);
        if (cancelled || !snap) return;
        setStatus(snap.status);
        if (snap.position) setPosition(snap.position);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load ride.");
      }
    };

    void loadSnapshot();

    channel = supabase
      .channel(`go-ride-live:${rideId}:${Math.random().toString(36).slice(2, 10)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "go_rides", filter: `id=eq.${rideId}` },
        (payload) => {
          const row = payload.new as RideRow;
          if (row.status) setStatus(row.status);
          const next = toPosition(row);
          if (next) setPosition(next);
        },
      )
      .subscribe((s, err) => {
        if (cancelled) return;
        if (s === "SUBSCRIBED") {
          setConnected(true);
          setError(null);
          void loadSnapshot(); // catch up on anything missed while disconnected
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
          setConnected(false);
          if (err) setError(err.message);
        }
      });

    const tick = window.setInterval(() => setNow(Date.now()), 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(tick);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [rideId]);

  const seenMs = position?.seenAt ? new Date(position.seenAt).getTime() : null;
  const isStale = seenMs != null && now - seenMs > STALE_AFTER_MS;

  return { position, status, connected, isStale, error };
}

/**
 * SheRides ride — location service.
 *
 * The database stores ONLY coordinates (go_rides.rider_lat / rider_lng and
 * go_rider_state.lat / lng). Maps, markers and the "Uber look" are drawn by
 * the frontend from these numbers.
 *
 * All writes go through the secure RPC `go_set_online` (SECURITY DEFINER),
 * which updates the rider's state and every active ride she is on.
 */
import { createClient } from "@/lib/supabase/client";
import type { GoRideStatus } from "@/lib/go";

export type GpsFix = { lat: number; lng: number; accuracyM: number | null };

export type RideLivePosition = {
  lat: number;
  lng: number;
  seenAt: string | null;
};

export type RideLiveSnapshot = {
  status: GoRideStatus;
  position: RideLivePosition | null;
};

/** Rider phone → database (location-only update, keeps online state). */
export async function sendRiderLocation(fix: GpsFix): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("SheRides is not connected to the database.");
  const { error } = await supabase.rpc("go_set_online", {
    p_online: null,
    p_lat: fix.lat,
    p_lng: fix.lng,
  });
  if (error) throw new Error(error.message);
}

/** Current status + last known rider position for one ride. */
export async function getRideLiveSnapshot(rideId: string): Promise<RideLiveSnapshot | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("go_rides")
    .select("status, rider_lat, rider_lng, rider_seen_at")
    .eq("id", rideId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    status: data.status as GoRideStatus,
    position: toPosition(data),
  };
}

/** Turn a go_rides row (or realtime payload) into a position, if it has one. */
export function toPosition(row: {
  rider_lat?: number | null;
  rider_lng?: number | null;
  rider_seen_at?: string | null;
}): RideLivePosition | null {
  if (row.rider_lat == null || row.rider_lng == null) return null;
  return { lat: row.rider_lat, lng: row.rider_lng, seenAt: row.rider_seen_at ?? null };
}

/** Browser GeolocationPosition → what the database expects. */
export function toGpsFix(pos: GeolocationPosition): GpsFix {
  const { latitude, longitude, accuracy } = pos.coords;
  return {
    lat: latitude,
    lng: longitude,
    accuracyM: accuracy == null ? null : Math.round(accuracy),
  };
}

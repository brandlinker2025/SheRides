import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoAppStatus, GoRideKind, GoRideStatus } from "@/lib/go";

export type RiderOverview = {
  pendingRiders: number;
  approvedRiders: number;
  suspendedRiders: number;
  onlineRiders: number;
  liveRides: number;
  completedToday: number;
  latestApplications: { id: string; full_name: string; status: GoAppStatus; bike_model: string | null; bike_plate: string | null }[];
  latestRides: { id: string; kind: GoRideKind; status: GoRideStatus; pickup_text: string; fare: number; rider_name: string | null }[];
  error: string | null;
};

/** Same 10-minute freshness window go_request_ride uses when matching: a closed tab never sends "offline". */
const ONLINE_WINDOW_MS = 10 * 60 * 1000;

function startOfDhakaDay() {
  const dhaka = new Date(Date.now() + 6 * 60 * 60 * 1000);
  dhaka.setUTCHours(0, 0, 0, 0);
  return new Date(dhaka.getTime() - 6 * 60 * 60 * 1000).toISOString();
}

/** Rider-only numbers for the admin dashboard. Uses the admin's own session, so RLS still applies. */
export async function loadRiderOverview(supabase: SupabaseClient): Promise<RiderOverview> {
  const riderApps = (status: GoAppStatus) =>
    supabase.from("go_applications").select("id", { count: "exact", head: true }).eq("role", "rider").eq("status", status);

  const [pending, approved, suspended, online, live, completed, apps, rides] = await Promise.all([
    riderApps("pending"),
    riderApps("approved"),
    riderApps("suspended"),
    supabase
      .from("go_rider_state")
      .select("user_id", { count: "exact", head: true })
      .eq("is_online", true)
      .gte("updated_at", new Date(Date.now() - ONLINE_WINDOW_MS).toISOString()),
    supabase.from("go_rides").select("id", { count: "exact", head: true }).in("status", ["requested", "accepted", "in_progress"]),
    supabase.from("go_rides").select("id", { count: "exact", head: true }).eq("status", "completed").gte("completed_at", startOfDhakaDay()),
    supabase
      .from("go_applications")
      .select("id, full_name, status, bike_model, bike_plate")
      .eq("role", "rider")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("go_rides")
      .select("id, kind, status, pickup_text, fare, rider:profiles!go_rides_rider_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const failed = [pending, approved, suspended, online, live, completed, apps, rides].find((r) => r.error);

  return {
    pendingRiders: pending.count ?? 0,
    approvedRiders: approved.count ?? 0,
    suspendedRiders: suspended.count ?? 0,
    onlineRiders: online.count ?? 0,
    liveRides: live.count ?? 0,
    completedToday: completed.count ?? 0,
    latestApplications: (apps.data ?? []) as RiderOverview["latestApplications"],
    latestRides: (rides.data ?? []).map((row: Record<string, unknown>) => {
      const rider = (Array.isArray(row.rider) ? row.rider[0] : row.rider) as { full_name: string } | null;
      return {
        id: row.id as string,
        kind: row.kind as GoRideKind,
        status: row.status as GoRideStatus,
        pickup_text: row.pickup_text as string,
        fare: row.fare as number,
        rider_name: rider?.full_name ?? null,
      };
    }),
    error: failed?.error ? `Could not load some rider numbers: ${failed.error.message}` : null,
  };
}

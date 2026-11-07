"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createServerSupabase } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = new Set(["approved", "rejected", "suspended", "pending"]);

export async function reviewGoApplication(applicationId: string, status: string, notes: string) {
  if (!UUID.test(applicationId) || !STATUSES.has(status)) return { error: "Invalid request." };
  try {
    await requireAdmin();
    // The review RPC checks auth.uid() is an admin, so it must run with the admin's own session.
    const session = await createServerSupabase();
    if (!session) return { error: "Supabase is not configured." };
    const { error } = await session.rpc("go_admin_review", {
      p_application_id: applicationId,
      p_status: status,
      p_notes: notes.slice(0, 500),
    });
    if (error) return { error: error.message };
    revalidatePath("/admin/go");
    revalidatePath("/admin");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save this review." };
  }
}

export async function adminCancelGoRide(rideId: string) {
  if (!UUID.test(rideId)) return { error: "Invalid request." };
  try {
    await requireAdmin();
    const session = await createServerSupabase();
    if (!session) return { error: "Supabase is not configured." };
    const { error } = await session.rpc("go_cancel_ride", { p_ride_id: rideId, p_reason: "Cancelled by SheRides admin" });
    if (error) return { error: error.message };
    revalidatePath("/admin/go");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not cancel this ride." };
  }
}

import { redirect } from "next/navigation";
import { createAdminClient } from "./admin";
import { createServerSupabase } from "./server";

export type StaffRole = "admin" | "moderator";

async function loadStaff() {
  const sessionClient = await createServerSupabase();
  if (!sessionClient) redirect("/admin-login");

  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();
  if (error || !user) redirect("/admin-login");

  const dataClient = createAdminClient() ?? sessionClient;
  const { data: profile } = await dataClient
    .from("profiles")
    .select("id, role, full_name, username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile, supabase: dataClient };
}

/**
 * Server-side guard for admin-only pages and actions (accounts, contacts, settings).
 *   - not signed in → /admin-login
 *   - moderator     → /admin/go (the part of the panel moderators may use)
 *   - anyone else   → /
 */
export async function requireAdmin() {
  const staff = await loadStaff();
  if (staff.profile?.role === "moderator") redirect("/admin/go");
  if (staff.profile?.role !== "admin") redirect("/");
  return staff;
}

/** Guard for pages and actions both admins and moderators may use (approvals, ride operations). */
export async function requireStaff() {
  const staff = await loadStaff();
  const role = staff.profile?.role;
  if (role !== "admin" && role !== "moderator") redirect("/");
  return { ...staff, role: role as StaffRole };
}

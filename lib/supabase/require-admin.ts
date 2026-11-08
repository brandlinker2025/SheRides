import { redirect } from "next/navigation";
import { isAdminProfileRole } from "@/lib/admin-access";
import { createAdminClient } from "./admin";
import { createServerSupabase } from "./server";

/**
 * Server-side admin guard for pages, server actions, and admin API routes.
 * A signed-in session is validated with getUser() (Auth server), then the
 * profiles.role column is read with that same session. There is no bypass.
 *   - not signed in        → /admin-login
 *   - missing or non-admin → /home
 *
 * The service-role client is used only after that check, for queries the
 * admin UI runs on the server. It is never sent to the browser.
 */
export async function requireAdmin() {
  const session = await createServerSupabase();
  if (!session) redirect("/admin-login");

  const {
    data: { user },
    error,
  } = await session.auth.getUser();

  if (error || !user) {
    redirect("/admin-login");
  }

  const { data: profile, error: profileError } = await session
    .from("profiles")
    .select("id, role, full_name, username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !isAdminProfileRole(profile?.role)) {
    redirect("/home");
  }

  return { user, profile, session, supabase: createAdminClient() ?? session };
}

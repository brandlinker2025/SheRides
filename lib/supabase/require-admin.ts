import { redirect } from "next/navigation";
import { createAdminClient } from "./admin";
import { createServerSupabase } from "./server";

/**
 * Server-side admin guard. Every admin page, layout, server action and admin API
 * route calls this. There is no bypass flag: a real signed-in admin session is
 * always required.
 *   - not signed in      → /admin-login
 *   - signed in, not admin → /home
 */
export async function requireAdmin() {
  const sessionClient = await createServerSupabase();
  if (!sessionClient) redirect("/admin-login");

  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    redirect("/admin-login");
  }

  const dataClient = createAdminClient() ?? sessionClient;

  const { data: profile } = await dataClient
    .from("profiles")
    .select("id, role, full_name, username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/home");
  }

  return { user, profile, supabase: dataClient };
}

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { ADMIN_OPEN_ACCESS } from "@/lib/admin/open-access";
import { createAdminClient } from "./admin";
import { createServerSupabase } from "./server";

const OPEN_ACCESS_USER = { id: "open-access" } as User;

export async function requireAdmin() {
  const sessionClient = await createServerSupabase();
  const dataClient = createAdminClient() ?? sessionClient;

  if (ADMIN_OPEN_ACCESS) {
    if (!dataClient) {
      throw new Error("Supabase is not configured.");
    }

    const {
      data: { user },
    } = sessionClient ? await sessionClient.auth.getUser() : { data: { user: null } };

    let profile = null;
    if (user) {
      const { data } = await dataClient
        .from("profiles")
        .select("id, role, full_name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      profile = data;
    }

    return { user: user ?? OPEN_ACCESS_USER, profile, supabase: dataClient };
  }

  if (!sessionClient) redirect("/admin-login");

  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error || !user) {
    redirect("/admin-login");
  }

  const { data: profile } = await (dataClient ?? sessionClient)
    .from("profiles")
    .select("id, role, full_name, username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/home");
  }

  return { user, profile, supabase: dataClient ?? sessionClient };
}

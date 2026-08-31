import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { ADMIN_OPEN_ACCESS } from "@/lib/admin/open-access";
import { createServerSupabase } from "./server";

const OPEN_ACCESS_USER = { id: "open-access" } as User;

export async function requireAdmin() {
  const supabase = await createServerSupabase();

  if (ADMIN_OPEN_ACCESS) {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let profile = null;
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("id, role, full_name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      profile = data;
    }

    return { user: user ?? OPEN_ACCESS_USER, profile, supabase };
  }

  if (!supabase) redirect("/admin-login");

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin-login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/home");
  }

  return { user, profile, supabase };
}

import { redirect } from "next/navigation";
import { createServerSupabase } from "./server";

export async function requireAdmin() {
  const supabase = await createServerSupabase();
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

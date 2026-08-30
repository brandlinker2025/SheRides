import { redirect } from "next/navigation";
import { requireUser } from "./require-user";
import { createServerSupabase } from "./server";

export async function requireAdmin() {
  const user = await requireUser();
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/login");

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

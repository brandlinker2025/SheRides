import { redirect } from "next/navigation";
import { promoteFirstAdmin } from "@/lib/admin/promote-first-admin";
import { requireUser } from "./require-user";
import { createServerSupabase } from "./server";

export async function requireAdmin() {
  const user = await requireUser();
  const supabase = createServerSupabase();
  if (!supabase) redirect("/login");

  await promoteFirstAdmin(supabase, user.id);

  if (user.email?.toLowerCase() === "admin@sherides.com") {
    await supabase.from("profiles").update({ role: "admin", verified: true }).eq("id", user.id);
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

import type { SupabaseClient } from "@supabase/supabase-js";

export async function promoteFirstAdmin(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.rpc("ensure_first_admin");
  if (!error) {
    const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    return data?.role === "admin";
  }

  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1);
  if (admins?.length) return admins[0]?.id === userId;

  const { data: first } = await supabase
    .from("profiles")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (first?.id === userId) {
    await supabase.from("profiles").update({ role: "admin" }).eq("id", userId);
    return true;
  }

  return false;
}

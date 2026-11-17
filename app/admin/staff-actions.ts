"use server";

import { revalidatePath } from "next/cache";
import { EMAIL_PATTERN, findAuthUserByEmail } from "@/lib/admin/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/require-admin";

/** Gives an email moderator access. Creates a confirmed login for that email if it has none yet. */
export async function addModerator(emailInput: string, nameInput: string) {
  const email = String(emailInput ?? "").trim().toLowerCase();
  const name = String(nameInput ?? "").trim().slice(0, 80);
  if (!EMAIL_PATTERN.test(email)) return { error: "Enter a valid email address." };
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return { error: "Server key is missing (SUPABASE_SERVICE_ROLE_KEY)." };
  try {
    let user = await findAuthUserByEmail(admin, email);
    if (!user) {
      const created = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: name || email.split("@")[0], username: `staff_${crypto.randomUUID().slice(0, 8)}` },
      });
      if (created.error || !created.data.user) return { error: created.error?.message ?? "Could not create the login." };
      user = created.data.user;
    }
    const { data: current } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (current?.role === "admin") return { error: "This email is already an admin." };
    const update: Record<string, unknown> = { role: "moderator", verified: true };
    if (name) update.full_name = name;
    const { error } = await admin.from("profiles").update(update).eq("id", user.id);
    if (error) return { error: error.message };
    revalidatePath("/admin/users");
    return { ok: `${email} can now sign in as a moderator with an email link.` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not add the moderator." };
  }
}

export async function removeModerator(userId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(String(userId))) return { error: "Invalid request." };
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return { error: "Server key is missing (SUPABASE_SERVICE_ROLE_KEY)." };
  const { error } = await admin.from("profiles").update({ role: "rider" }).eq("id", userId).eq("role", "moderator");
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { ok: "Moderator access removed." };
}

"use server";

import { revalidatePath } from "next/cache";
import { EMAIL_PATTERN, findAuthUserByEmail, newStaffToken, sha256Hex } from "@/lib/admin/staff";
import { SITE_URL } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/require-admin";

/**
 * Adds a moderator. The email is optional: staff sign in with a private link, so a name is enough
 * (an internal placeholder address is used then). Returns her login link right away.
 */
export async function addModerator(emailInput: string, nameInput: string) {
  const name = String(nameInput ?? "").trim().slice(0, 80);
  let email = String(emailInput ?? "").trim().toLowerCase();
  if (!name && !email) return { error: "Write the moderator's name." };
  if (email && !EMAIL_PATTERN.test(email)) return { error: "That email does not look right." };
  if (!email) email = `staff-${crypto.randomUUID().slice(0, 8)}@staff.sherides.online`;
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
    const link = await issueLink(admin, user.id, name || email);
    revalidatePath("/admin/users");
    return { ok: `${name || email} is now a moderator. Send her this private login link:`, link };
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
  await admin.from("staff_access_links").update({ revoked_at: new Date().toISOString() }).eq("user_id", userId).is("revoked_at", null);
  revalidatePath("/admin/users");
  return { ok: "Moderator access removed." };
}

async function issueLink(admin: NonNullable<ReturnType<typeof createAdminClient>>, userId: string, label: string) {
  const token = newStaffToken();
  const now = new Date().toISOString();
  await admin.from("staff_access_links").update({ revoked_at: now }).eq("user_id", userId).is("revoked_at", null);
  const { error } = await admin
    .from("staff_access_links")
    .insert({ user_id: userId, token_hash: await sha256Hex(token), label: label.slice(0, 80) });
  if (error) throw new Error(/staff_access_links/.test(error.message) ? "Run the latest database update first (staff_access_links)." : error.message);
  return `${SITE_URL}/staff/${token}`;
}

/** New private login link for a staff member. Her old link stops working. Shown once; only a hash is stored. */
export async function createStaffLink(userId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(String(userId))) return { error: "Invalid request." };
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return { error: "Server key is missing (SUPABASE_SERVICE_ROLE_KEY)." };
  const { data: profile } = await admin.from("profiles").select("role, full_name").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin" && profile?.role !== "moderator") return { error: "Only admins and moderators get login links." };
  try {
    const link = await issueLink(admin, userId, (profile.full_name as string | null) ?? "staff");
    revalidatePath("/admin/users");
    return { ok: "New private login link (the old one no longer works):", link };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create the link." };
  }
}

/** Cancels every login link of this staff member (for example if a phone is lost). */
export async function revokeStaffLinks(userId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(String(userId))) return { error: "Invalid request." };
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return { error: "Server key is missing (SUPABASE_SERVICE_ROLE_KEY)." };
  const { error } = await admin
    .from("staff_access_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { ok: "Login link cancelled. Create a new one when needed." };
}

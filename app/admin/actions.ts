"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteMemberById } from "@/lib/admin/remove-member";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createServerSupabase } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function cleanText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function refreshAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/go");
  revalidatePath("/admin/verifications");
}

export async function setRiderVerified(userId: string, verified: boolean) {
  if (!validUuid(userId) || typeof verified !== "boolean") return { error: "Invalid request." };
  await requireAdmin();

  const admin = createAdminClient();
  if (admin) {
    const { error } = await admin.from("profiles").update({ verified }).eq("id", userId);
    if (error) return { error: error.message };
  } else {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return { error: "Member approval is not configured on this server." };
    }

    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.rpc("admin_set_verified", {
      target_id: userId,
      is_verified: verified,
    });
    if (error) return { error: error.message };
  }

  refreshAdmin();
  revalidatePath("/go");
  revalidatePath("/pending-approval");
  return {};
}

export async function resetMemberPassword(userId: string, newPassword: string) {
  if (!validUuid(userId)) return { error: "Invalid request." };
  if (typeof newPassword !== "string" || newPassword.length < 6 || newPassword.length > 72) {
    return { error: "Use at least 6 characters for the new password." };
  }

  try {
    await requireAdmin();
    const session = await createServerSupabase();
    if (!session) {
      return { error: "Password reset is not configured on this server." };
    }

    const { error } = await session.rpc("admin_reset_member_password", {
      target_id: userId,
      new_password: newPassword,
    });
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not reset this password." };
  }
}

export async function removeMember(userId: string) {
  try {
    const { user, profile } = await requireAdmin();
    const actorId = profile?.id ?? (user.id !== "open-access" ? user.id : null);
    const result = await deleteMemberById(userId, actorId);
    if (result.error) return result;
    refreshAdmin();
    revalidatePath("/go");
    revalidatePath("/pending-approval");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not remove this member." };
  }
}

export async function reviewRiderVerification(
  verificationId: string,
  approve: boolean,
  notes = ""
) {
  if (!validUuid(verificationId) || typeof approve !== "boolean") return { error: "Invalid verification request." };
  const { supabase } = await requireAdmin();
  const reviewNotes = cleanText(notes, 500) || null;
  const { error } = await supabase.rpc("review_rider_verification", {
    target_verification_id: verificationId,
    approve,
    review_notes: reviewNotes,
  });
  if (error) return { error: error.message };
  refreshAdmin();
  revalidatePath("/go");
  return {};
}

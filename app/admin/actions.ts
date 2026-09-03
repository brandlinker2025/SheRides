"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteMemberById } from "@/lib/admin/remove-member";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createServerSupabase } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_KINDS = new Set(["Ride", "Workshop", "Meetup", "Tour"]);

function validUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function cleanText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function safeImageUrl(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed.slice(0, 2048);
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? url.toString().slice(0, 2048) : null;
  } catch {
    return null;
  }
}

function refreshAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/events");
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
  revalidatePath("/home");
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
    revalidatePath("/home");
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
  revalidatePath("/home");
  return {};
}

export async function deletePost(postId: string) {
  if (!validUuid(postId)) return { error: "Invalid post." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { error: error.message };
  refreshAdmin();
  return {};
}

export type EventInput = {
  title: string;
  description: string;
  kind: "Ride" | "Workshop" | "Meetup" | "Tour";
  location: string;
  startsAt: string;
  endsAt?: string;
  coverUrl?: string;
  featured?: boolean;
};

export async function createEvent(input: EventInput) {
  const { user, supabase } = await requireAdmin();
  const startsAt = parseDate(input.startsAt);
  const endsAt = input.endsAt ? parseDate(input.endsAt) : null;
  if (!cleanText(input.title, 120) || !startsAt) {
    return { error: "Title and start time are required." };
  }
  if (!EVENT_KINDS.has(input.kind)) return { error: "Invalid event type." };
  if (input.endsAt && !endsAt) return { error: "End time is invalid." };
  if (endsAt && endsAt < startsAt) return { error: "End time must be after the start time." };
  const { error } = await supabase.from("events").insert({
    title: cleanText(input.title, 120),
    description: cleanText(input.description, 5000) || null,
    kind: input.kind,
    location: cleanText(input.location, 200) || null,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt?.toISOString() ?? null,
    cover_url: safeImageUrl(input.coverUrl),
    featured: Boolean(input.featured),
    created_by: user.id,
  });
  if (error) return { error: error.message };
  refreshAdmin();
  return {};
}

export async function updateEvent(eventId: string, input: EventInput) {
  if (!validUuid(eventId)) return { error: "Invalid event." };
  const { supabase } = await requireAdmin();
  const startsAt = parseDate(input.startsAt);
  const endsAt = input.endsAt ? parseDate(input.endsAt) : null;
  if (!cleanText(input.title, 120) || !startsAt) {
    return { error: "Title and start time are required." };
  }
  if (!EVENT_KINDS.has(input.kind)) return { error: "Invalid event type." };
  if (input.endsAt && !endsAt) return { error: "End time is invalid." };
  if (endsAt && endsAt < startsAt) return { error: "End time must be after the start time." };
  const { error } = await supabase
    .from("events")
    .update({
      title: cleanText(input.title, 120),
      description: cleanText(input.description, 5000) || null,
      kind: input.kind,
      location: cleanText(input.location, 200) || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt?.toISOString() ?? null,
      cover_url: safeImageUrl(input.coverUrl),
      featured: Boolean(input.featured),
    })
    .eq("id", eventId);
  if (error) return { error: error.message };
  refreshAdmin();
  return {};
}

export async function deleteEvent(eventId: string) {
  if (!validUuid(eventId)) return { error: "Invalid event." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) return { error: error.message };
  refreshAdmin();
  return {};
}

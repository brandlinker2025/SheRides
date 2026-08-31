"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/require-admin";

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
  const { supabase } = await requireAdmin();
  const writer = createAdminClient() ?? supabase;
  const { error } = await writer.from("profiles").update({ verified }).eq("id", userId);
  if (error) return { error: error.message };
  refreshAdmin();
  revalidatePath("/home");
  revalidatePath("/pending-approval");
  return {};
}

function isMissingAuthUser(message: string, status?: number) {
  return status === 404 || /user not found/i.test(message);
}

export async function removeMember(userId: string) {
  if (!validUuid(userId)) return { error: "Invalid request." };
  const { user, profile } = await requireAdmin();
  if (user.id === userId || profile?.id === userId) {
    return { error: "You cannot remove your own account." };
  }

  // profiles has RLS and no DELETE policy, so a session client can "succeed" with 0 rows.
  const admin = createAdminClient();
  if (!admin) {
    return { error: "Member removal is not configured on this server." };
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError && !isMissingAuthUser(authError.message, authError.status)) {
    return { error: authError.message };
  }

  const { data: leftover, error: leftoverError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (leftoverError) return { error: leftoverError.message };

  if (leftover) {
    const { data: removed, error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId)
      .select("id");
    if (profileError) return { error: profileError.message };
    if (!removed?.length) {
      return { error: "Could not remove this member." };
    }
  }

  refreshAdmin();
  revalidatePath("/home");
  revalidatePath("/pending-approval");
  return {};
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

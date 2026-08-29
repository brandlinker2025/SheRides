"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/require-admin";

function refreshAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/events");
  revalidatePath("/admin/verifications");
}

export async function setRiderVerified(userId: string, verified: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("profiles").update({ verified }).eq("id", userId);
  if (error) return { error: error.message };
  refreshAdmin();
  return {};
}

export async function deletePost(postId: string) {
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
  if (!input.title.trim() || !input.startsAt) {
    return { error: "Title and start time are required." };
  }
  const { error } = await supabase.from("events").insert({
    title: input.title.trim(),
    description: input.description.trim() || null,
    kind: input.kind,
    location: input.location.trim() || null,
    starts_at: new Date(input.startsAt).toISOString(),
    ends_at: input.endsAt ? new Date(input.endsAt).toISOString() : null,
    cover_url: input.coverUrl?.trim() || null,
    featured: Boolean(input.featured),
    created_by: user.id,
  });
  if (error) return { error: error.message };
  refreshAdmin();
  return {};
}

export async function updateEvent(eventId: string, input: EventInput) {
  const { supabase } = await requireAdmin();
  if (!input.title.trim() || !input.startsAt) {
    return { error: "Title and start time are required." };
  }
  const { error } = await supabase
    .from("events")
    .update({
      title: input.title.trim(),
      description: input.description.trim() || null,
      kind: input.kind,
      location: input.location.trim() || null,
      starts_at: new Date(input.startsAt).toISOString(),
      ends_at: input.endsAt ? new Date(input.endsAt).toISOString() : null,
      cover_url: input.coverUrl?.trim() || null,
      featured: Boolean(input.featured),
    })
    .eq("id", eventId);
  if (error) return { error: error.message };
  refreshAdmin();
  return {};
}

export async function deleteEvent(eventId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) return { error: error.message };
  refreshAdmin();
  return {};
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { riderFromProfile } from "./profile";
import type { Rider } from "./types";

export const BASS_GIFT_FOLLOWERS = 1000;

export function hasBassGift(followers: number) {
  return followers >= BASS_GIFT_FOLLOWERS;
}

type Client = SupabaseClient;

export async function fetchFollowStats(supabase: Client, riderId: string, myId?: string | null) {
  const followersQuery = supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", riderId);
  const followingQuery = supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", riderId);
  const mineQuery =
    myId && myId !== riderId
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", myId)
          .eq("following_id", riderId)
          .maybeSingle()
      : Promise.resolve({ data: null as { follower_id?: string } | null, error: null });

  const [followersRes, followingRes, existing] = await Promise.all([
    followersQuery,
    followingQuery,
    mineQuery,
  ]);

  return {
    followers: followersRes.error ? null : (followersRes.count ?? 0),
    following: followingRes.error ? null : (followingRes.count ?? 0),
    isFollowing: Boolean(existing.data),
  };
}

export async function setFollowing(supabase: Client, myId: string, riderId: string, follow: boolean) {
  if (myId === riderId) return "You cannot follow yourself.";
  if (follow) {
    const { error } = await supabase.from("follows").insert({ follower_id: myId, following_id: riderId });
    if (error && error.code !== "23505") return error.message;
    return null;
  }
  const { error } = await supabase.from("follows").delete().eq("follower_id", myId).eq("following_id", riderId);
  return error?.message ?? null;
}

/** Home "Who's on SheRides" only: newest riders the current user does not already follow. */
export async function fetchUnfollowedRiders(supabase: Client, myId: string, limit = 24): Promise<Rider[]> {
  const [{ data: rows }, { data: follows }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(64),
    supabase.from("follows").select("following_id").eq("follower_id", myId),
  ]);
  const hidden = new Set<string>([myId, ...(follows ?? []).map((row) => row.following_id as string)]);
  return (rows ?? [])
    .filter((row) => !hidden.has(row.id as string))
    .slice(0, limit)
    .map((row) => riderFromProfile(row.id as string, row as Record<string, unknown>));
}

export async function openDirectMessage(supabase: Client, otherId: string) {
  const { data, error } = await supabase.rpc("get_or_create_dm", { other_id: otherId });
  if (error || !data) {
    return { id: null as string | null, error: error?.message || "Could not open that conversation." };
  }
  return { id: String(data), error: null as string | null };
}

export async function sendConversationMessage(
  supabase: Client,
  conversationId: string,
  senderId: string,
  text: string
) {
  const { data, error } = await supabase.rpc("send_conversation_message", {
    target_conversation_id: conversationId,
    message_text: text,
  });
  if (!error && data) {
    return { id: String(data), error: null as string | null };
  }

  const inserted = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content: text })
    .select("id")
    .single();
  if (inserted.error || !inserted.data) {
    return {
      id: null as string | null,
      error: error?.message || inserted.error?.message || "Message could not be sent.",
    };
  }
  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  return { id: inserted.data.id as string, error: null as string | null };
}

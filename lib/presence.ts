import type { SupabaseClient } from "@supabase/supabase-js";
import { toDiscoverableRiders } from "./profile";
import type { Rider } from "./types";

type Client = SupabaseClient;

export const ONLINE_WINDOW_MS = 2 * 60 * 1000;
export const HEARTBEAT_MS = 30_000;
export const ONLINE_POLL_MS = 20_000;

function missingPresence(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "PGRST202" ||
    /could not find the (table|function)|schema cache|user_presence|heartbeat_presence/i.test(error.message ?? "")
  );
}

export async function heartbeatPresence(supabase: Client) {
  const rpc = await supabase.rpc("heartbeat_presence");
  if (!rpc.error) return null;
  if (!missingPresence(rpc.error)) return rpc.error.message;

  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) return null;
  const { error } = await supabase
    .from("user_presence")
    .upsert({ user_id: id, last_seen_at: new Date().toISOString() });
  if (missingPresence(error)) return null;
  return error?.message ?? null;
}

export type MessengerFriend = Rider & { online: boolean };

/** Followed members plus 1:1 DM partners. Self and tester/seed accounts stay hidden. */
export async function fetchMessengerFriends(supabase: Client, myId: string, limit = 80): Promise<MessengerFriend[]> {
  const [{ data: follows }, { data: memberships }] = await Promise.all([
    supabase.from("follows").select("following_id").eq("follower_id", myId),
    supabase.from("conversation_members").select("conversation_id").eq("user_id", myId),
  ]);

  const friendIds = new Set<string>();
  for (const row of follows ?? []) {
    const id = row.following_id as string;
    if (id && id !== myId) friendIds.add(id);
  }

  const convIds = (memberships ?? []).map((row) => row.conversation_id as string).filter(Boolean);
  if (convIds.length) {
    const [{ data: convs }, { data: others }] = await Promise.all([
      supabase.from("conversations").select("id, is_group").in("id", convIds),
      supabase.from("conversation_members").select("conversation_id, user_id").in("conversation_id", convIds).neq("user_id", myId),
    ]);
    const dmIds = new Set(
      (convs ?? []).filter((row) => row.is_group !== true).map((row) => row.id as string)
    );
    for (const row of others ?? []) {
      const id = row.user_id as string;
      if (!id || id === myId) continue;
      if (convs?.length && !dmIds.has(row.conversation_id as string)) continue;
      friendIds.add(id);
    }
  }

  if (!friendIds.size) return [];

  const ids = [...friendIds];
  const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
  const [{ data: profiles }, presence] = await Promise.all([
    supabase.from("profiles").select("*").in("id", ids),
    supabase.from("user_presence").select("user_id").in("user_id", ids).gte("last_seen_at", since),
  ]);

  const onlineIds = new Set<string>();
  if (!missingPresence(presence.error)) {
    for (const row of presence.data ?? []) onlineIds.add(row.user_id as string);
  }

  return toDiscoverableRiders((profiles ?? []) as Record<string, unknown>[], myId, limit)
    .map((rider) => ({ ...rider, online: onlineIds.has(rider.id) }))
    .sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      return a.fullName.localeCompare(b.fullName);
    });
}

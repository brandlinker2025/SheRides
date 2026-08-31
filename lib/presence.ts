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

export async function fetchOnlineRiders(supabase: Client, myId: string, limit = 24): Promise<Rider[]> {
  const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
  const { data: rows, error } = await supabase
    .from("user_presence")
    .select("user_id")
    .gte("last_seen_at", since)
    .neq("user_id", myId)
    .order("last_seen_at", { ascending: false })
    .limit(40);
  if (missingPresence(error) || error || !rows?.length) return [];

  const ids = rows.map((row) => row.user_id as string);
  const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
  const order = new Map(ids.map((id, index) => [id, index]));
  return toDiscoverableRiders((profiles ?? []) as Record<string, unknown>[], myId, limit).sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
  );
}

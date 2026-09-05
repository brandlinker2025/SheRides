"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { mapInboxNotification, type InboxNotification, type NotificationRow } from "./notification-map";
import { createClient } from "./supabase/client";

export type { InboxNotification, NotificationRow } from "./notification-map";
export { mapInboxNotification } from "./notification-map";

type Client = NonNullable<ReturnType<typeof createClient>>;

async function hydrateNotifications(supabase: Client, rows: NotificationRow[]): Promise<InboxNotification[]> {
  const actorIds = [...new Set(rows.map((row) => row.actor_id).filter((id): id is string => Boolean(id)))];
  const names = new Map<string, { full_name?: string | null; avatar_url?: string | null }>();
  if (actorIds.length) {
    const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", actorIds);
    for (const profile of data ?? []) {
      names.set(profile.id as string, profile);
    }
  }
  return rows.map((row) => mapInboxNotification(row, row.actor_id ? names.get(row.actor_id) : undefined));
}

function missingRpc(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST202" ||
    /could not find the function|schema cache|list_inbox_notifications|mark_inbox_read/i.test(error.message ?? "")
  );
}

export async function fetchInboxNotifications(supabase: Client, userId: string, limit = 50) {
  const rpc = await supabase.rpc("list_inbox_notifications", { p_limit: limit });
  if (!rpc.error) {
    return {
      items: ((rpc.data ?? []) as NotificationRow[]).map((row) => mapInboxNotification(row)),
      error: null as string | null,
    };
  }
  if (!missingRpc(rpc.error)) return { items: [] as InboxNotification[], error: rpc.error.message };

  const { data, error } = await supabase
    .from("notifications")
    .select("id, body, href, read, created_at, kind, actor_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { items: [] as InboxNotification[], error: error.message };
  return {
    items: await hydrateNotifications(supabase, (data ?? []) as NotificationRow[]),
    error: null as string | null,
  };
}

export async function markNotificationRead(supabase: Client, id: string) {
  const rpc = await supabase.rpc("mark_inbox_read", { p_id: id });
  if (!rpc.error) return Number(rpc.data) > 0 ? null : "Could not mark this notification read.";
  if (!missingRpc(rpc.error)) return rpc.error.message;

  const { data, error } = await supabase.from("notifications").update({ read: true }).eq("id", id).select("id");
  if (error) return error.message;
  return data?.length ? null : "Could not mark this notification read.";
}

export async function markAllNotificationsRead(supabase: Client, userId: string) {
  const rpc = await supabase.rpc("mark_inbox_read", { p_id: null });
  if (!rpc.error) return null;
  if (!missingRpc(rpc.error)) return rpc.error.message;

  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  return error?.message ?? null;
}

export function useInboxNotifications() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    if (!supabase || !userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const { items: next, error: loadError } = await fetchInboxNotifications(supabase, userId);
      setError(loadError);
      setItems(next);
    } catch {
      setError("Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !userId) return;
    const channel = supabase
      .channel(`notifications-inbox:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          void refresh();
        }
      )
      .subscribe();
    const timer = window.setInterval(() => {
      void refresh();
    }, 15000);
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [refresh, userId]);

  const markRead = useCallback(async (id: string) => {
    const supabase = createClient();
    if (!supabase) return;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
    const saveError = await markNotificationRead(supabase, id);
    if (saveError) await refresh();
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    const supabase = createClient();
    if (!supabase || !userId) return;
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
    const saveError = await markAllNotificationsRead(supabase, userId);
    if (saveError) await refresh();
  }, [refresh, userId]);

  const unread = items.reduce((sum, item) => sum + (item.unread ? 1 : 0), 0);

  return { items, unread, loading, error, refresh, markRead, markAllRead };
}

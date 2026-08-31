"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { formatRelativeTime } from "./profile";
import { createClient } from "./supabase/client";

export type InboxNotification = {
  id: string;
  actor: string;
  actorId: string | null;
  avatar: string;
  body: string;
  time: string;
  unread: boolean;
  href: string;
  kind: string;
};

type NotificationRow = {
  id: string;
  body: string | null;
  href: string | null;
  read: boolean | null;
  created_at: string;
  kind: string | null;
  actor_id: string | null;
};

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
  return rows.map((row) => {
    const actor = row.actor_id ? names.get(row.actor_id) : undefined;
    return {
      id: row.id,
      actor: actor?.full_name || "SheRides",
      actorId: row.actor_id,
      avatar: actor?.avatar_url || "",
      body: row.body || "",
      time: formatRelativeTime(row.created_at),
      unread: !row.read,
      href: row.href || "/home",
      kind: row.kind || "notice",
    };
  });
}

export async function fetchInboxNotifications(supabase: Client, userId: string, limit = 50) {
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
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  return error?.message ?? null;
}

export async function markAllNotificationsRead(supabase: Client, userId: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId);
  return error?.message ?? null;
}

export function useInboxNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    if (!supabase || !user) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { items: next, error: loadError } = await fetchInboxNotifications(supabase, user.id);
    setError(loadError);
    setItems(next);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user) return;
    const channel = supabase
      .channel(`notifications-inbox:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          void refresh();
        }
      )
      .subscribe();
    const timer = window.setInterval(() => {
      void refresh();
    }, 20000);
    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [refresh, user]);

  const markRead = useCallback(
    async (id: string) => {
      const supabase = createClient();
      if (!supabase) return;
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
      await markNotificationRead(supabase, id);
    },
    []
  );

  const markAllRead = useCallback(async () => {
    const supabase = createClient();
    if (!supabase || !user) return;
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
    await markAllNotificationsRead(supabase, user.id);
  }, [user]);

  const unread = items.reduce((sum, item) => sum + (item.unread ? 1 : 0), 0);

  return { items, unread, loading, error, refresh, markRead, markAllRead };
}

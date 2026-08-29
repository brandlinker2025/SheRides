"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { formatRelativeTime } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";

type Note = {
  id: string;
  actor: string;
  avatar: string;
  body: string;
  time: string;
  unread: boolean;
  href: string;
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Note[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user) return;
    void supabase
      .from("notifications")
      .select("id, body, href, read, created_at, actor:profiles!actor_id(full_name, avatar_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(
          (data ?? []).map((row) => {
            const actor = (Array.isArray(row.actor) ? row.actor[0] : row.actor) as {
              full_name?: string;
              avatar_url?: string;
            } | null;
            return {
              id: row.id as string,
              actor: actor?.full_name || "SheRides",
              avatar: actor?.avatar_url || "",
              body: (row.body as string) || "",
              time: formatRelativeTime(row.created_at as string),
              unread: !row.read,
              href: (row.href as string) || "/home",
            };
          })
        );
      });
  }, [user]);

  async function markAllRead() {
    const supabase = createClient();
    if (!supabase || !user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id);
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  return (
    <div className="max-w-2xl mx-auto px-container-margin-mobile py-section-gap">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline-xl text-headline-xl">Notifications</h1>
        <button type="button" onClick={() => void markAllRead()} className="font-label-lg text-accent-magenta">
          Mark all read
        </button>
      </div>
      {items.length === 0 ? (
        <EmptyState
          variant="notifications"
          title="No notifications yet."
          body="Welcome messages and community updates will show up here."
        />
      ) : (
        <div className="card-surface divide-y divide-surface-border overflow-hidden">
          {items.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className={`flex gap-4 p-4 transition-colors duration-200 hover:bg-soft-off-white ${n.unread ? "bg-accent-magenta/5" : ""}`}
            >
              <Avatar src={n.avatar} alt={n.actor} size={48} />
              <div className="flex-1 min-w-0">
                <p className="font-body-md text-body-md">
                  <span className="font-label-lg">{n.actor}</span> {n.body}
                </p>
                <p className="font-body-sm text-tertiary">{n.time}</p>
              </div>
              {n.unread && (
                <span className="relative flex h-2.5 w-2.5 mt-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-magenta opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-magenta" />
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

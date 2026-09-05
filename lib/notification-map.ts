import { formatRelativeTime } from "./profile";

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

export type NotificationRow = {
  id: string;
  body: string | null;
  href: string | null;
  read?: boolean | null;
  is_read?: boolean | null;
  created_at: string;
  kind: string | null;
  actor_id: string | null;
  actor_name?: string | null;
  actor_avatar?: string | null;
};

export function mapInboxNotification(
  row: NotificationRow,
  actor?: { full_name?: string | null; avatar_url?: string | null }
): InboxNotification {
  const read = row.is_read ?? row.read ?? false;
  return {
    id: row.id,
    actor: actor?.full_name || row.actor_name || "SheRides",
    actorId: row.actor_id,
    avatar: actor?.avatar_url || row.actor_avatar || "",
    body: row.body || "",
    time: formatRelativeTime(row.created_at),
    unread: !read,
    href: row.href || "/home",
    kind: row.kind || "notice",
  };
}

import type { InboxNotification, NotificationRow } from "./notification-map";

const RIDE_KINDS = new Set([
  "go_request",
  "go_accepted",
  "go_started",
  "go_completed",
  "go_rider_cancelled",
  "go_cancelled",
  "go_low_rating",
  "go_review",
  "go_message",
  "birthday",
  "partner_review",
  "membership_review",
]);

const SOCIAL_OR_SOS =
  /urgent harassment|started following|commented on your|liked your|reacted to your message/i;

/** Ride-sharing inbox only. Social follows, posts, DMs and old SOS alerts stay in the database but are not shown. */
export function isRideNotification(item: { kind?: string | null; body?: string | null }): boolean {
  const kind = (item.kind ?? "").toLowerCase();
  const body = item.body ?? "";
  if (SOCIAL_OR_SOS.test(body)) return false;
  if (kind === "emergency_alert" || kind === "sos" || kind === "follow" || kind === "like" || kind === "comment" || kind === "reaction" || kind === "message" || kind === "post" || kind === "story" || kind === "welcome") {
    return false;
  }
  return RIDE_KINDS.has(kind);
}

export function rideNotificationHref(kind: string | null | undefined, href: string | null | undefined): string {
  if (kind === "birthday") return "/profile";
  if (!href || href.startsWith("/home") || href.startsWith("/messages") || href.startsWith("/safety") || href.startsWith("/rider-benefits") || href.startsWith("/explore")) {
    return "/go";
  }
  return href;
}

export function visibleInboxItems(items: InboxNotification[]): InboxNotification[] {
  return items
    .filter((item) => isRideNotification(item))
    .map((item) => ({ ...item, href: rideNotificationHref(item.kind, item.href) }));
}

export function visibleNotificationRows(rows: NotificationRow[]): NotificationRow[] {
  return rows.filter((row) => isRideNotification(row));
}

"use client";

import { BackLink } from "@/components/ui/BackLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotificationRow } from "@/components/layout/NotificationsBell";
import { useInboxNotifications } from "@/lib/notifications";

export default function NotificationsPage() {
  const { items, unread, loading, error, markRead, markAllRead } = useInboxNotifications();

  return (
    <div className="max-w-2xl mx-auto px-container-margin-mobile py-section-gap">
      <BackLink href="/home" label="Home" className="mb-4" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline-xl text-headline-xl">Notifications</h1>
        {unread > 0 ? (
          <button type="button" onClick={() => void markAllRead()} className="font-label-lg text-accent-magenta">
            Mark all read
          </button>
        ) : null}
      </div>
      {loading ? <p className="font-body-sm text-tertiary">Loading notifications…</p> : null}
      {error ? (
        <p className="font-body-sm text-error" role="alert">
          Could not load notifications.
        </p>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState
          variant="notifications"
          title="No notifications yet."
          body="Messages, comments, reactions, and new followers will show up here."
        />
      ) : null}
      {!loading && !error && items.length > 0 ? (
        <div className="card-surface divide-y divide-surface-border overflow-hidden">
          {items.map((item) => (
            <NotificationRow key={item.id} item={item} onOpen={(opened) => opened.unread && void markRead(opened.id)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

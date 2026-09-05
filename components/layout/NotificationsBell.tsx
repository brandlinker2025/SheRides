"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useInboxNotifications, type InboxNotification } from "@/lib/notifications";

export function NotificationRow({
  item,
  onOpen,
}: {
  item: InboxNotification;
  onOpen: (item: InboxNotification) => void | Promise<void>;
}) {
  const router = useRouter();
  return (
    <a
      href={item.href}
      onClick={(event) => {
        event.preventDefault();
        void Promise.resolve(onOpen(item)).finally(() => {
          router.push(item.href);
        });
      }}
      className={`flex gap-3 p-3 transition-colors duration-200 hover:bg-soft-off-white ${
        item.unread ? "bg-accent-magenta/5" : ""
      }`}
    >
      <Avatar src={item.avatar} alt={item.actor} size={40} />
      <div className="flex-1 min-w-0">
        <p className="font-body-sm text-body-sm text-on-surface">
          <span className="font-label-lg">{item.actor}</span>{" "}
          <span className={item.kind === "birthday" ? "whitespace-pre-line" : undefined}>{item.body}</span>
        </p>
        <p className="font-body-sm text-tertiary">{item.time}</p>
      </div>
      {item.unread ? (
        <span className="relative flex h-2.5 w-2.5 mt-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-magenta opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-magenta" />
        </span>
      ) : null}
    </a>
  );
}

export function NotificationsBell() {
  const { items, unread, loading, error, markRead, markAllRead } = useInboxNotifications();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (boxRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const panel = open ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      className="fixed right-3 top-[4.5rem] z-[80] w-[min(24rem,calc(100vw-1.5rem))] max-h-[min(28rem,70vh)] flex flex-col rounded-xl border border-surface-border bg-surface-container-lowest shadow-premium overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-border">
        <h2 className="font-headline-md text-body-lg text-on-surface">Notifications</h2>
        {unread > 0 ? (
          <button type="button" onClick={() => void markAllRead()} className="font-label-lg text-accent-magenta">
            Mark all read
          </button>
        ) : null}
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? <p className="px-4 py-6 font-body-sm text-tertiary">Loading notifications…</p> : null}
        {!loading && error ? (
          <p className="px-4 py-6 font-body-sm text-error" role="alert">
            Could not load notifications.
          </p>
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="font-label-lg text-on-surface mb-1">No notifications yet.</p>
            <p className="font-body-sm text-tertiary">
              Messages, comments, reactions, and new followers will show up here.
            </p>
          </div>
        ) : null}
        {!loading && !error
          ? items.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onOpen={async (opened) => {
                  if (opened.unread) await markRead(opened.id);
                  setOpen(false);
                }}
              />
            ))
          : null}
      </div>
      <Link
        href="/notifications"
        onClick={() => setOpen(false)}
        className="block text-center font-label-lg text-accent-magenta px-4 py-3 border-t border-surface-border hover:bg-soft-off-white"
      >
        See all
      </Link>
    </div>
  ) : null;

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-on-primary hover:bg-white/10 transition-colors relative"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Icon name="notifications" filled={open || unread > 0} />
        {unread > 0 ? (
          <span className="absolute top-1.5 right-1.5 min-w-[1.05rem] h-[1.05rem] px-1 rounded-full bg-accent-magenta text-white text-[10px] leading-[1.05rem] font-label-lg text-center">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {mounted ? createPortal(panel, document.body) : panel}
    </div>
  );
}

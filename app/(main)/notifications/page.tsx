"use client";

import Link from "next/link";
import { useState } from "react";
import { notifications as seed } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";

export default function NotificationsPage() {
  const [items, setItems] = useState(seed);

  return (
    <div className="max-w-2xl mx-auto px-container-margin-mobile py-section-gap">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline-xl text-headline-xl">Notifications</h1>
        <button
          type="button"
          onClick={() => setItems((prev) => prev.map((n) => ({ ...n, unread: false })))}
          className="font-label-lg text-accent-magenta"
        >
          Mark all read
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-premium divide-y divide-surface-border">
        {items.map((n) => (
          <Link
            key={n.id}
            href={n.href}
            className={`flex gap-4 p-4 hover:bg-soft-off-white ${n.unread ? "bg-accent-magenta/5" : ""}`}
          >
            <Avatar src={n.avatar} alt={n.actor} size={48} />
            <div className="flex-1 min-w-0">
              <p className="font-body-md text-body-md">
                <span className="font-label-lg">{n.actor}</span> {n.body}
              </p>
              <p className="font-body-sm text-tertiary">{n.time}</p>
            </div>
            {n.unread && <span className="w-2 h-2 rounded-full bg-accent-magenta mt-2" />}
          </Link>
        ))}
      </div>
    </div>
  );
}

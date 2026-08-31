"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/auth-context";
import { ONLINE_POLL_MS, fetchMessengerFriends, type MessengerFriend } from "@/lib/presence";
import { createClient } from "@/lib/supabase/client";
import { useUI } from "@/lib/ui-context";

export function OnlineMessenger() {
  const { user } = useAuth();
  const { openChatDock, chatDocks } = useUI();
  const myId = user?.id;
  const [riders, setRiders] = useState<MessengerFriend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !myId) {
      setRiders([]);
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = () => {
      void fetchMessengerFriends(supabase, myId).then((next) => {
        if (cancelled) return;
        setRiders(next);
        setLoading(false);
      });
    };

    load();
    const timer = window.setInterval(load, ONLINE_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [myId]);

  return (
    <div className="card-surface card-hover p-6">
      <div className="flex justify-between items-center gap-3 mb-4">
        <h3 className="font-headline-md text-body-lg font-bold text-on-surface">Messenger</h3>
        <span className="inline-flex items-center gap-1.5 font-label-caps text-label-caps text-secondary">
          <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
          Online
        </span>
      </div>
      <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto">
        {loading && <p className="font-body-sm text-tertiary">Loading…</p>}
        {!loading && riders.length === 0 && <p className="font-body-sm text-tertiary">No friends yet.</p>}
        {riders.map((rider) => {
          const open = chatDocks.some((dock) => dock.id === rider.id);
          return (
            <button
              key={rider.id}
              type="button"
              onClick={() => openChatDock({ id: rider.id, fullName: rider.fullName, avatar: rider.avatar })}
              className={`w-full flex gap-3 items-center min-w-0 rounded-lg p-1 -mx-1 text-left hover:bg-surface-container-low transition-colors ${
                open ? "bg-surface-container-low" : ""
              }`}
            >
              <span className="relative shrink-0">
                <Avatar src={rider.avatar} alt={rider.fullName} size={40} />
                {rider.online ? (
                  <span
                    className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-surface-container-lowest"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block font-label-lg text-label-lg text-on-surface truncate">{rider.fullName}</span>
                <span className="block font-body-sm text-body-sm text-tertiary truncate">
                  {rider.online ? "Online" : rider.location || rider.bike || ""}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

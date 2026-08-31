"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/auth-context";
import { ONLINE_POLL_MS, fetchOnlineRiders } from "@/lib/presence";
import { createClient } from "@/lib/supabase/client";
import type { Rider } from "@/lib/types";

export function OnlineMessenger() {
  const { user } = useAuth();
  const myId = user?.id;
  const [riders, setRiders] = useState<Rider[]>([]);
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
      void fetchOnlineRiders(supabase, myId).then((next) => {
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
        {!loading && riders.length === 0 && <p className="font-body-sm text-tertiary">No riders online.</p>}
        {riders.map((rider) => (
          <Link
            key={rider.id}
            href={`/messages?to=${encodeURIComponent(rider.id)}`}
            className="flex gap-3 items-center min-w-0 rounded-lg p-1 -mx-1 hover:bg-surface-container-low transition-colors"
          >
            <span className="relative shrink-0">
              <Avatar src={rider.avatar} alt={rider.fullName} size={40} />
              <span
                className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-surface-container-lowest"
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0">
              <span className="block font-label-lg text-label-lg text-on-surface truncate">{rider.fullName}</span>
              <span className="block font-body-sm text-body-sm text-tertiary truncate">
                {rider.location || rider.bike || "Online"}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

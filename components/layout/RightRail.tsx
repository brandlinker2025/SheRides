"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OnlineMessenger } from "@/components/messages/OnlineMessenger";
import { trendingHashtags } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "../ui/Icon";

type RailEvent = { id: string; title: string; location: string; starts_at: string; attending_count: number };

export function RightRail() {
  const { user } = useAuth();
  const [events, setEvents] = useState<RailEvent[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    void supabase
      .from("events")
      .select("id, title, location, starts_at, attending_count")
      .order("starts_at", { ascending: true })
      .limit(3)
      .then(({ data }) => setEvents((data ?? []) as RailEvent[]));
  }, []);

  return (
    <div className="hidden lg:flex flex-col col-span-4 gap-component-gap">
      <div className="card-surface card-hover p-6 border-t-4 border-accent-magenta">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-accent-magenta/10 flex items-center justify-center text-accent-magenta">
            <Icon name="workspace_premium" filled size={32} />
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              {user?.verified ? "Verified Rider" : "Welcome to SheRides"}
            </h3>
            <p className="font-body-sm text-body-sm text-tertiary">
              {user?.verified ? "Your verified badge is visible on your profile." : "Complete your profile and join a city community."}
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="block w-full text-center bg-soft-off-white text-accent-magenta font-label-lg text-label-lg py-2 rounded-lg hover:bg-accent-magenta/10 transition-colors"
        >
          View profile
        </Link>
      </div>

      <div className="card-surface card-hover p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline-md text-body-lg font-bold text-on-surface">Upcoming Events</h3>
          <Link href="/events" className="font-label-lg text-label-lg text-accent-magenta hover:underline">
            See All
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          {events.length === 0 && <p className="font-body-sm text-tertiary">No events yet.</p>}
          {events.map((event) => {
            const date = new Date(event.starts_at);
            return (
              <Link key={event.id} href="/events" className="flex gap-4 items-start group">
                <div className="bg-surface-container-low rounded-lg p-2 text-center min-w-[60px] group-hover:bg-accent-magenta group-hover:text-white transition-colors">
                  <span className="block font-label-caps text-label-caps text-accent-magenta group-hover:text-white">
                    {date.toLocaleString(undefined, { month: "short" }).toUpperCase()}
                  </span>
                  <span className="block font-headline-md text-[20px] font-bold">{date.getDate()}</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface group-hover:text-accent-magenta transition-colors">
                    {event.title}
                  </h4>
                  <p className="font-body-sm text-body-sm text-tertiary">
                    {event.location} • {event.attending_count} attending
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <OnlineMessenger />

      <div className="card-surface card-hover p-6">
        <h3 className="font-headline-md text-body-lg font-bold text-on-surface mb-4">Trending Hashtags</h3>
        <div className="flex flex-col gap-3">
          {trendingHashtags.map((h) => (
            <Link key={h.tag} href="/explore" className="flex justify-between items-center group">
              <span className="font-label-lg text-label-lg text-accent-magenta group-hover:underline">{h.tag}</span>
              <span className="font-body-sm text-body-sm text-tertiary">{h.posts}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

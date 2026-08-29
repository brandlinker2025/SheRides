"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { img } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";

type RideRow = {
  id: string;
  title: string;
  location: string;
  starts_at: string;
  attending_count: number;
  cover_url: string | null;
  kind: string;
};

export default function RidesPage() {
  const [rides, setRides] = useState<RideRow[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    void supabase
      .from("events")
      .select("*")
      .in("kind", ["Ride", "Tour", "Meetup"])
      .order("starts_at", { ascending: true })
      .then(({ data }) => setRides((data ?? []) as RideRow[]));
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto px-container-margin-mobile md:px-container-margin-desktop py-section-gap">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-10">
        <div>
          <h1 className="font-headline-xl text-headline-xl mb-2">Rides</h1>
          <p className="font-body-md text-secondary">Group rides, coffee runs, and scenic tours in Bangladesh.</p>
        </div>
        <Link
          href="/events"
          className="h-12 px-6 bg-accent-magenta text-white font-label-lg rounded-full inline-flex items-center justify-center"
        >
          Browse all events
        </Link>
      </div>
      {rides.length === 0 ? (
        <EmptyState title="No rides yet." body="Check Events after the community calendar is seeded." />
      ) : (
        <div className="flex flex-col gap-4">
          {rides.map((ride) => {
            const date = new Date(ride.starts_at);
            return (
              <article key={ride.id} className="bg-white rounded-xl shadow-premium overflow-hidden flex flex-col md:flex-row">
                <img src={ride.cover_url || img.canyon} alt="" className="md:w-64 h-40 md:h-auto object-cover" />
                <div className="p-6 flex-1 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="bg-surface-container-low rounded-lg p-3 text-center min-w-[64px]">
                    <p className="font-label-caps text-accent-magenta">
                      {date.toLocaleString(undefined, { month: "short" }).toUpperCase()}
                    </p>
                    <p className="font-headline-md text-[22px] leading-none">{date.getDate()}</p>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline-md text-body-lg font-semibold">{ride.title}</h3>
                    <p className="font-body-sm text-tertiary flex items-center gap-1 mt-1">
                      <Icon name="location_on" size={16} /> {ride.location} • {ride.attending_count} attending
                    </p>
                  </div>
                  <Link href="/events" className="text-accent-magenta font-label-lg">
                    View ride
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

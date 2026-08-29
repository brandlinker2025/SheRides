"use client";

import Link from "next/link";
import { events } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";

export default function RidesPage() {
  const rides = events.filter((e) => e.kind === "Ride" || e.kind === "Tour" || e.kind === "Meetup");

  return (
    <div className="max-w-[1280px] mx-auto px-container-margin-mobile md:px-container-margin-desktop py-section-gap">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-10">
        <div>
          <h1 className="font-headline-xl text-headline-xl mb-2">Rides</h1>
          <p className="font-body-md text-secondary">Group rides, coffee runs, and scenic tours.</p>
        </div>
        <Link
          href="/events"
          className="h-12 px-6 bg-accent-magenta text-white font-label-lg rounded-full inline-flex items-center justify-center"
        >
          Browse all events
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        {rides.map((ride) => (
          <article key={ride.id} className="bg-white rounded-xl shadow-premium overflow-hidden flex flex-col md:flex-row">
            <img src={ride.cover} alt="" className="md:w-64 h-40 md:h-auto object-cover" />
            <div className="p-6 flex-1 flex flex-col md:flex-row md:items-center gap-4">
              <div className="bg-surface-container-low rounded-lg p-3 text-center min-w-[64px]">
                <p className="font-label-caps text-accent-magenta">{ride.month}</p>
                <p className="font-headline-md text-[22px] leading-none">{ride.day}</p>
              </div>
              <div className="flex-1">
                <h3 className="font-headline-md text-body-lg font-semibold">{ride.title}</h3>
                <p className="font-body-sm text-tertiary flex items-center gap-1 mt-1">
                  <Icon name="location_on" size={16} /> {ride.location} • {ride.attending} attending
                </p>
              </div>
              <Link href="/events" className="text-accent-magenta font-label-lg">
                View ride
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

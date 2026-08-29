"use client";

import Link from "next/link";
import { events, riders, trendingHashtags } from "@/lib/data";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";
import { useState } from "react";

export function RightRail() {
  const upcoming = events.filter((e) => !e.featured).slice(0, 3);
  const suggested = riders.filter((r) => r.id !== "me").slice(0, 3);
  const [following, setFollowing] = useState<string[]>([]);

  return (
    <div className="hidden lg:flex flex-col col-span-4 gap-component-gap">
      <div className="bg-surface-container-lowest rounded-xl shadow-premium p-6 border-t-4 border-accent-magenta">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-accent-magenta/10 flex items-center justify-center text-accent-magenta">
            <Icon name="workspace_premium" filled size={32} />
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Verified Rider</h3>
            <p className="font-body-sm text-body-sm text-tertiary">
              You are in the top 5% of active members this month.
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="block w-full text-center bg-soft-off-white text-accent-magenta font-label-lg text-label-lg py-2 rounded-lg hover:bg-accent-magenta/10 transition-colors"
        >
          View Perks
        </Link>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-premium p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline-md text-body-lg font-bold text-on-surface">Upcoming Events</h3>
          <Link href="/events" className="font-label-lg text-label-lg text-accent-magenta hover:underline">
            See All
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          {upcoming.map((event) => (
            <Link key={event.id} href="/events" className="flex gap-4 items-start group">
              <div className="bg-surface-container-low rounded-lg p-2 text-center min-w-[60px] group-hover:bg-accent-magenta group-hover:text-white transition-colors">
                <span className="block font-label-caps text-label-caps text-accent-magenta group-hover:text-white">
                  {event.month}
                </span>
                <span className="block font-headline-md text-[20px] font-bold">{event.day}</span>
              </div>
              <div>
                <h4 className="font-label-lg text-label-lg text-on-surface group-hover:text-accent-magenta transition-colors">
                  {event.title}
                </h4>
                <p className="font-body-sm text-body-sm text-tertiary">
                  {event.location} • {event.attending} attending
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-premium p-6">
        <h3 className="font-headline-md text-body-lg font-bold text-on-surface mb-4">Suggested Riders</h3>
        <div className="flex flex-col gap-4">
          {suggested.map((rider) => {
            const followed = following.includes(rider.id);
            return (
              <div key={rider.id} className="flex justify-between items-center">
                <Link href={`/profile/${rider.id}`} className="flex gap-3 items-center min-w-0">
                  <Avatar src={rider.avatar} alt={rider.fullName} size={40} />
                  <div className="min-w-0">
                    <h4 className="font-label-lg text-label-lg text-on-surface truncate">{rider.fullName}</h4>
                    <p className="font-body-sm text-body-sm text-tertiary truncate">{rider.bio}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    setFollowing((prev) =>
                      prev.includes(rider.id) ? prev.filter((id) => id !== rider.id) : [...prev, rider.id]
                    )
                  }
                  className={`px-3 py-1 rounded-full border font-label-lg text-label-lg transition-colors ${
                    followed
                      ? "border-accent-magenta text-accent-magenta bg-accent-magenta/10"
                      : "border-surface-border text-on-surface hover:border-accent-magenta hover:text-accent-magenta"
                  }`}
                >
                  {followed ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-premium p-6">
        <h3 className="font-headline-md text-body-lg font-bold text-on-surface mb-4">Trending Hashtags</h3>
        <div className="flex flex-col gap-3">
          {trendingHashtags.map((h) => (
            <Link key={h.tag} href="/explore" className="flex justify-between items-center group">
              <span className="font-label-lg text-label-lg text-accent-magenta group-hover:underline">{h.tag}</span>
              <span className="font-body-sm text-body-sm text-tertiary">{h.posts} posts</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

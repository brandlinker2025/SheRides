"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { img } from "@/lib/images";
import type { Rider } from "@/lib/types";
import { useFeed } from "@/lib/feed-context";
import { Icon } from "../ui/Icon";
import { FeedPost } from "../feed/FeedPost";

const tabs = ["Posts", "Photos", "Videos", "Rides", "Achievements"] as const;

type ProfileViewProps = {
  rider: Rider;
  isSelf?: boolean;
  onSignOut?: () => void;
};

export function ProfileView({ rider, isSelf, onSignOut }: ProfileViewProps) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Posts");
  const [following, setFollowing] = useState(false);
  const { posts, toggleLike, toggleSave } = useFeed();
  const router = useRouter();
  const riderPosts = posts.filter((p) => p.author.id === rider.id || (isSelf && p.author.id === "me"));

  return (
    <div className="max-w-[1280px] mx-auto px-container-margin-mobile md:px-container-margin-desktop w-full pb-section-gap">
      <div className="relative w-full bg-white rounded-xl shadow-premium overflow-hidden mt-6">
        <div className="w-full h-48 md:h-80 bg-soft-off-white relative">
          <img src={rider.cover} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="px-6 md:px-12 pb-8 relative">
          <div className="absolute -top-16 md:-top-24 left-6 md:left-12">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white bg-soft-off-white overflow-hidden shadow-md">
              <img src={rider.avatar} alt={rider.fullName} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="pt-20 md:pt-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:pl-56">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-headline-xl text-headline-xl text-on-background">{rider.fullName}</h1>
                {rider.verified && <Icon name="verified" filled className="text-accent-magenta" />}
              </div>
              <p className="font-body-lg text-body-lg text-secondary mb-2">{rider.bio}</p>
              <div className="flex items-center gap-4 font-body-sm text-body-sm text-tertiary flex-wrap">
                <span className="flex items-center gap-1">
                  <Icon name="location_on" size={16} /> {rider.location}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="two_wheeler" size={16} /> {rider.bike}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              {isSelf ? (
                <>
                  <button
                    type="button"
                    className="flex-1 md:flex-none px-8 py-3 bg-accent-magenta text-white rounded-lg font-label-lg"
                  >
                    Edit profile
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="flex-1 md:flex-none px-8 py-3 bg-deep-charcoal text-white rounded-lg font-label-lg"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setFollowing((v) => !v)}
                    className="flex-1 md:flex-none px-8 py-3 bg-accent-magenta text-white rounded-lg font-label-lg"
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/messages")}
                    className="flex-1 md:flex-none px-8 py-3 bg-deep-charcoal text-white rounded-lg font-label-lg"
                  >
                    Message
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-8 mt-8 pt-6 border-t border-surface-border">
            {[
              [rider.followers, "Followers"],
              [rider.following, "Following"],
              [rider.postsCount, "Posts"],
              [rider.ridesCount, "Rides"],
            ].map(([n, label]) => (
              <div key={String(label)} className="flex flex-col">
                <span className="font-headline-md text-headline-md text-on-background">
                  {typeof n === "number" && n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n}
                </span>
                <span className="font-label-caps text-label-caps text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 mb-6 flex overflow-x-auto gap-8 border-b border-surface-border pb-1 hide-scrollbar">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`font-label-lg text-label-lg pb-2 whitespace-nowrap ${
              tab === t ? "text-accent-magenta border-b-2 border-accent-magenta" : "text-secondary hover:text-on-background"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Posts" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 flex flex-col gap-6">
            {riderPosts.length ? (
              riderPosts.map((post) => (
                <FeedPost key={post.id} post={post} onToggleLike={toggleLike} onToggleSave={toggleSave} />
              ))
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-premium font-body-md text-secondary">No posts yet.</div>
            )}
          </div>
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-xl p-6 shadow-premium">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="event" className="text-accent-magenta" />
                <h3 className="font-headline-md text-headline-md">Upcoming Ride</h3>
              </div>
              <p className="font-label-lg mb-1">Valley Loop Meetup</p>
              <p className="font-body-sm text-secondary mb-4">Saturday, 9:00 AM • 45 miles</p>
              <button type="button" className="w-full py-2 bg-soft-off-white font-label-lg rounded-lg border border-surface-border hover:border-accent-magenta">
                View Details
              </button>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-premium">
              <h3 className="font-headline-md text-headline-md mb-4">Recent Snaps</h3>
              <div className="grid grid-cols-2 gap-2">
                {[img.dash, img.storyCrew, img.helmetCafe, img.sunset].map((src, i) => (
                  <div key={src} className="aspect-square rounded-lg overflow-hidden relative">
                    <img src={src} alt="" className={`w-full h-full object-cover ${i === 3 ? "opacity-80" : ""}`} />
                    {i === 3 && (
                      <span className="absolute inset-0 flex items-center justify-center text-white font-label-lg">+12 more</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "Photos" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[img.pch, img.canyon, img.cover, img.coffee, img.gloves, img.dash].map((src) => (
            <img key={src} src={src} alt="" className="aspect-square object-cover rounded-xl" />
          ))}
        </div>
      )}

      {tab !== "Posts" && tab !== "Photos" && (
        <div className="bg-white rounded-xl shadow-premium p-10 text-center font-body-md text-secondary">
          {tab} for {rider.fullName} will appear here.
        </div>
      )}
    </div>
  );
}

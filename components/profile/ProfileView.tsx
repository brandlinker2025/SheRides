"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Rider } from "@/lib/types";
import { useFeed } from "@/lib/feed-context";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "../ui/EmptyState";
import { Icon } from "../ui/Icon";
import { Avatar } from "../ui/Avatar";
import { FeedPost } from "../feed/FeedPost";
import { EditProfileModal } from "./EditProfileModal";
import { RoleBadge } from "./RoleBadge";

const tabs = ["Posts", "Photos", "Rides", "Achievements"] as const;

type ProfileViewProps = {
  rider: Rider;
  isSelf?: boolean;
  onSignOut?: () => void;
};

export function ProfileView({ rider, isSelf, onSignOut }: ProfileViewProps) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Posts");
  const [editing, setEditing] = useState(false);
  const [following, setFollowing] = useState(false);
  const { posts, toggleLike, toggleSave } = useFeed();
  const router = useRouter();
  const riderPosts = posts.filter((post) => post.author.id === rider.id);
  const photos = riderPosts.filter((post) => post.image);
  const rides = useMemo(
    () => posts.filter((post) => post.author.id === rider.id && /ride|tour|meetup/i.test(post.content)),
    [posts, rider.id]
  );

  return (
    <div className="max-w-[1280px] mx-auto px-container-margin-mobile md:px-container-margin-desktop w-full pb-section-gap">
      <div className="relative w-full bg-surface-container-lowest rounded-xl shadow-premium overflow-hidden mt-6">
        <div className="w-full h-48 md:h-80 bg-soft-off-white relative">
          {rider.cover ? (
            <img src={rider.cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-accent-magenta/25 via-soft-off-white to-primary-fixed" />
          )}
        </div>
        <div className="px-6 md:px-12 pb-8 relative">
          <div className="absolute -top-16 md:-top-24 left-6 md:left-12">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-surface-container-lowest bg-soft-off-white overflow-hidden shadow-md">
              <Avatar src={rider.avatar} alt={rider.fullName} size={192} className="w-full h-full" />
            </div>
          </div>
          <div className="pt-20 md:pt-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:pl-56">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="font-headline-xl text-headline-xl text-on-background">{rider.fullName}</h1>
                {rider.verified && <Icon name="verified" filled className="text-emerald-600" />}
              </div>
              <div className="mb-3">
                <RoleBadge rider={rider} />
              </div>
              <p className="font-body-lg text-body-lg text-secondary mb-2">
                {rider.bio || (isSelf ? "Add a short bio so other riders can find you." : "")}
              </p>
              <div className="flex items-center gap-4 font-body-sm text-body-sm text-tertiary flex-wrap">
                {rider.location && (
                  <span className="flex items-center gap-1">
                    <Icon name="location_on" size={16} /> {rider.location}
                  </span>
                )}
                {rider.bike && (
                  <span className="flex items-center gap-1">
                    <Icon name="two_wheeler" size={16} /> {rider.bike}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              {isSelf ? (
                <>
                  {rider.role === "admin" && (
                    <button
                      type="button"
                      onClick={() => router.push("/admin")}
                      className="flex-1 md:flex-none px-8 py-3 border border-outline rounded-lg font-label-lg"
                    >
                      Admin panel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
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
                    onClick={async () => {
                      const supabase = createClient();
                      if (!supabase) return;
                      const { data, error } = await supabase.rpc("get_or_create_dm", { other_id: rider.id });
                      if (error || !data) {
                        window.alert(error?.message || "Could not open that conversation.");
                        return;
                      }
                      router.push(`/messages?c=${data}`);
                    }}
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
              [riderPosts.length || rider.postsCount, "Posts"],
              [rider.ridesCount, "Rides"],
            ].map(([n, label]) => (
              <div key={String(label)} className="flex flex-col">
                <span className="font-headline-md text-headline-md text-on-background">{n}</span>
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
            className={`font-label-lg text-label-lg pb-2 whitespace-nowrap transition-colors duration-200 ${
              tab === t ? "text-accent-magenta border-b-2 border-accent-magenta" : "text-secondary hover:text-on-background"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Posts" &&
        (riderPosts.length ? (
          <div className="flex flex-col gap-6 max-w-3xl">
            {riderPosts.map((post) => (
              <FeedPost key={post.id} post={post} onToggleLike={toggleLike} onToggleSave={toggleSave} />
            ))}
          </div>
        ) : (
          <EmptyState variant="feed" title="এখনো কোনো পোস্ট নেই। প্রথম পোস্ট করুন! 🏍️" />
        ))}

      {tab === "Photos" &&
        (photos.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((post) => (
              <img key={post.id} src={post.image} alt="" className="aspect-square object-cover rounded-xl" />
            ))}
          </div>
        ) : (
          <EmptyState title="এখনো কোনো ছবি নেই।" body="Upload a photo with your next post." />
        ))}

      {tab === "Rides" &&
        (rides.length ? (
          <div className="flex flex-col gap-4 max-w-3xl">
            {rides.map((post) => (
              <FeedPost key={post.id} post={post} onToggleLike={toggleLike} onToggleSave={toggleSave} />
            ))}
          </div>
        ) : (
          <EmptyState title="No rides yet." body="RSVP to an event or share your first ride post." />
        ))}

      {tab === "Achievements" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              rider.verified ? { icon: "verified", label: "Verified rider" } : null,
              riderPosts.length > 0 ? { icon: "article", label: "First post" } : null,
              rider.role === "admin" ? { icon: "admin_panel_settings", label: "Community admin" } : null,
              rider.bike ? { icon: "two_wheeler", label: rider.bike } : null,
            ] as Array<{ icon: string; label: string } | null>
          )
            .filter((item): item is { icon: string; label: string } => Boolean(item))
            .map((item) => (
              <div
                key={item.label}
                className="card-surface card-hover p-6 border border-surface-border"
              >
                <Icon name={item.icon} className="text-accent-magenta mb-2" />
                <p className="font-label-lg">{item.label}</p>
              </div>
            ))}
          {!rider.verified && riderPosts.length === 0 && !rider.bike && (
            <EmptyState title="Achievements will appear as you ride and post." />
          )}
        </div>
      )}

      {editing && <EditProfileModal onClose={() => setEditing(false)} />}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Rider } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "../ui/Icon";
import { Avatar } from "../ui/Avatar";
import { EditProfileModal } from "./EditProfileModal";
import { RoleBadge } from "./RoleBadge";

type ProfileViewProps = {
  rider: Rider;
  isSelf?: boolean;
};

type RideStats = { asPassenger: number; asRider: number };

export function ProfileView({ rider, isSelf }: ProfileViewProps) {
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState<RideStats | null>(null);
  const router = useRouter();

  // Ride totals are private: go_rides rows are only readable by their own participants.
  useEffect(() => {
    if (!isSelf) return;
    const supabase = createClient();
    if (!supabase) return;
    let active = true;
    const count = (column: "passenger_id" | "rider_id") =>
      supabase.from("go_rides").select("id", { count: "exact", head: true }).eq(column, rider.id).eq("status", "completed");
    void Promise.all([count("passenger_id"), count("rider_id")]).then(([p, r]) => {
      if (active) setStats({ asPassenger: p.count ?? 0, asRider: r.count ?? 0 });
    });
    return () => {
      active = false;
    };
  }, [isSelf, rider.id]);

  return (
    <div className="max-w-[1280px] mx-auto px-container-margin-mobile md:px-container-margin-desktop w-full pb-section-gap">
      <div className="relative w-full bg-surface-container-lowest rounded-xl shadow-premium overflow-hidden mt-6">
        <div className="w-full h-64 sm:h-72 md:h-[24rem] bg-soft-off-white relative">
          {rider.cover ? (
            <img src={rider.cover} alt="" className="w-full h-full object-cover object-center" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-accent-magenta/25 via-soft-off-white to-primary-fixed" />
          )}
        </div>
        <div className="px-6 md:px-10 pb-7 relative">
          <div className="absolute -top-16 md:-top-20 left-6 md:left-10">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-surface-container-lowest bg-soft-off-white overflow-hidden shadow-md">
              <Avatar src={rider.avatar} alt={rider.fullName} size={176} className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="pt-20 md:pt-5 flex flex-col md:flex-row justify-between items-start md:items-end gap-5 md:pl-52">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="font-headline-xl text-headline-xl text-on-background">{rider.fullName}</h1>
                {rider.verified && <Icon name="verified" filled className="text-emerald-600" />}
              </div>
              <div className="mb-2">
                <RoleBadge rider={rider} />
              </div>
              <p className="font-body-lg text-body-lg text-secondary mb-2">
                {rider.bio || (isSelf ? "Add a short bio so riders and passengers know who you are." : "")}
              </p>
              {isSelf && !rider.hasBirthday ? (
                <p className="font-body-sm text-accent-magenta mb-2">Add your birthday so SheRides can send you a yearly wish.</p>
              ) : null}
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
                    <button type="button" onClick={() => router.push("/admin")} className="flex-1 md:flex-none px-6 py-2.5 border border-outline rounded-lg font-label-lg">Admin panel</button>
                  )}
                  <button type="button" onClick={() => setEditing(true)} className="flex-1 md:flex-none px-6 py-2.5 bg-accent-magenta text-white rounded-lg font-label-lg">Edit profile</button>
                </>
              ) : null}
            </div>
          </div>
          {isSelf && (
            <div className="flex gap-8 mt-6 pt-5 border-t border-surface-border">
              {[[stats?.asPassenger ?? "–", "Rides taken"], [stats?.asRider ?? "–", "Rides given"]].map(([n, label]) => (
                <div key={String(label)} className="flex flex-col"><span className="font-headline-md text-headline-md text-on-background">{n}</span><span className="font-label-caps text-label-caps text-secondary">{label}</span></div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isSelf && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: "/go", icon: "two_wheeler", label: "Book a ride" },
            { href: "/go?tab=rides", icon: "history", label: "My rides" },
            { href: "/safety", icon: "shield", label: "Safety Center" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="card-surface card-hover p-5 flex items-center gap-3">
              <Icon name={item.icon} className="text-accent-magenta" />
              <span className="font-label-lg flex-1">{item.label}</span>
              <Icon name="chevron_right" className="text-tertiary" />
            </Link>
          ))}
        </div>
      )}

      {editing && <EditProfileModal onClose={() => setEditing(false)} />}
    </div>
  );
}

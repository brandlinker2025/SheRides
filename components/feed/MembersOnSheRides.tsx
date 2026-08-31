"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toDiscoverableRiders } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import type { Rider } from "@/lib/types";
import { Avatar } from "../ui/Avatar";

export function MembersOnSheRides() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Rider[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user?.id) return;
    void supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(48)
      .then(({ data }) => {
        setMembers(toDiscoverableRiders((data ?? []) as Record<string, unknown>[], user.id, 24));
      });
  }, [user?.id]);

  if (members.length === 0) {
    return (
      <section className="card-surface p-5">
        <h2 className="font-headline-md text-body-lg font-bold text-on-surface mb-1">Who&apos;s on SheRides</h2>
        <p className="font-body-sm text-tertiary">You&apos;re the first rider here. Invite a friend to follow you.</p>
      </section>
    );
  }

  return (
    <section className="card-surface p-5">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <div>
          <h2 className="font-headline-md text-body-lg font-bold text-on-surface">Who&apos;s on SheRides</h2>
          <p className="font-body-sm text-tertiary">Open a rider to follow or message.</p>
        </div>
        <span className="font-label-caps text-label-caps text-secondary">{members.length} riders</span>
      </div>
      <div className="flex gap-4 overflow-x-auto snap-x hide-scrollbar pb-1">
        {members.map((rider) => (
          <Link
            key={rider.id}
            href={`/profile/${rider.id}`}
            className="snap-start flex-shrink-0 w-36 card-hover rounded-xl border border-surface-border bg-surface-container-low p-3 text-center"
          >
            <Avatar src={rider.avatar} alt={rider.fullName} size={64} className="mx-auto mb-2" />
            <p className="font-label-lg text-label-lg text-on-surface truncate">{rider.fullName}</p>
            <p className="font-body-sm text-body-sm text-tertiary truncate">
              {rider.location || rider.bike || "SheRides member"}
            </p>
            <span className="mt-2 inline-block font-label-caps text-label-caps text-accent-magenta">View profile</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchUnfollowedRiders, setFollowing } from "@/lib/social";
import { createClient } from "@/lib/supabase/client";
import type { Rider } from "@/lib/types";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";

export function useUnfollowedRiders(limit = 24) {
  const { user } = useAuth();
  const myId = user?.id;
  const [members, setMembers] = useState<Rider[]>([]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !myId) return;
    let cancelled = false;
    void fetchUnfollowedRiders(supabase, myId, limit).then((riders) => {
      if (!cancelled) setMembers(riders);
    });
    return () => {
      cancelled = true;
    };
  }, [myId, limit]);

  const followRider = useCallback(
    async (riderId: string) => {
      const supabase = createClient();
      if (!supabase || !myId) return;
      const error = await setFollowing(supabase, myId, riderId, true);
      if (!error) setMembers((current) => current.filter((rider) => rider.id !== riderId));
    },
    [myId]
  );

  return { members, followRider };
}

export function MembersOnSheRides({ members }: { members: Rider[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 2);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    el.addEventListener("scroll", updateArrows, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", updateArrows);
    };
  }, [members, updateArrows]);

  function scrollByPage(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.75, 160), behavior: "smooth" });
  }

  if (members.length === 0) {
    return (
      <section className="card-surface p-5">
        <h2 className="font-headline-md text-body-lg font-bold text-on-surface mb-1">Who&apos;s on SheRides</h2>
        <p className="font-body-sm text-tertiary">No new riders to follow right now.</p>
      </section>
    );
  }

  const showArrows = members.length > 1;

  return (
    <section className="card-surface p-5">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <div>
          <h2 className="font-headline-md text-body-lg font-bold text-on-surface">Who&apos;s on SheRides</h2>
          <p className="font-body-sm text-tertiary">Open a rider to follow or message.</p>
        </div>
        <span className="font-label-caps text-label-caps text-secondary">{members.length} riders</span>
      </div>
      <div className="relative">
        {showArrows ? (
          <button
            type="button"
            aria-label="Previous riders"
            disabled={!canPrev}
            onClick={() => scrollByPage(-1)}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-surface-border bg-surface-container-lowest p-1 text-on-surface shadow-md hover:bg-accent-magenta hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <Icon name="chevron_left" size={24} />
          </button>
        ) : null}
        <div
          ref={scrollerRef}
          className={`flex gap-4 overflow-x-auto snap-x hide-scrollbar pb-1 ${showArrows ? "px-8" : ""}`}
        >
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
        {showArrows ? (
          <button
            type="button"
            aria-label="Next riders"
            disabled={!canNext}
            onClick={() => scrollByPage(1)}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-surface-border bg-surface-container-lowest p-1 text-on-surface shadow-md hover:bg-accent-magenta hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <Icon name="chevron_right" size={24} />
          </button>
        ) : null}
      </div>
    </section>
  );
}

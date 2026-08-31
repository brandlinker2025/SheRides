"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toDiscoverableRiders } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import type { Rider } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { Avatar } from "../ui/Avatar";
import { ThemeToggle } from "../ui/ThemeToggle";
import { BrandLogo } from "../ui/BrandLogo";
import { NotificationsBell } from "./NotificationsBell";

export function TopNav() {
  const { user, signOut } = useAuth();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Rider[]>([]);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q || !user?.id) {
      setHits([]);
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    const handle = window.setTimeout(() => {
      void supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(80)
        .then(({ data }) => {
          const riders = toDiscoverableRiders((data ?? []) as Record<string, unknown>[], user.id).filter(
            (rider) => rider.fullName.toLowerCase().includes(q) || rider.username.toLowerCase().includes(q)
          );
          setHits(riders.slice(0, 8));
          setOpen(true);
        });
    }, 200);
    return () => window.clearTimeout(handle);
  }, [query, user?.id]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <header className="panda-topnav fixed top-0 w-full z-50 flex justify-between items-center px-gutter py-base shadow-nav">
      <div className="flex items-center gap-gutter">
        <Link href="/home" aria-label="SheRides home">
          <BrandLogo className="text-[36px] sm:text-[40px]" />
        </Link>
        <div ref={searchRef} className="hidden md:block relative">
          <div className="flex items-center bg-surface-container-low/10 rounded-full px-4 py-2 w-64 border border-white/10 focus-within:border-accent-magenta transition-colors">
            <Icon name="search" className="text-on-primary/70 mr-2" />
            <input
              className="bg-transparent border-none text-on-primary placeholder:text-on-primary/50 focus:ring-0 focus:outline-none w-full text-body-sm font-body-sm"
              placeholder="Search SheRides..."
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (hits.length > 0 || query.trim()) setOpen(true);
              }}
              aria-label="Search people"
            />
          </div>
          {open && query.trim() ? (
            <div className="absolute left-0 top-[calc(100%+8px)] w-80 rounded-xl border border-surface-border bg-surface-container-lowest shadow-premium overflow-hidden">
              {hits.length === 0 ? (
                <p className="px-4 py-3 font-body-sm text-tertiary">No riders found.</p>
              ) : (
                <ul>
                  {hits.map((rider) => (
                    <li key={rider.id}>
                      <Link
                        href={`/profile/${rider.id}`}
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low"
                      >
                        <Avatar src={rider.avatar} alt={rider.fullName} size={36} />
                        <span className="min-w-0">
                          <span className="block font-label-lg text-label-lg text-on-surface truncate">{rider.fullName}</span>
                          <span className="block font-body-sm text-tertiary truncate">
                            {rider.location || rider.username || "SheRides member"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {user?.role === "admin" && (
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1 px-3 h-10 rounded-full text-on-primary hover:bg-white/10 transition-colors font-label-lg"
            aria-label="Admin panel"
          >
            <Icon name="admin_panel_settings" />
            <span className="hidden md:inline">Admin</span>
          </Link>
        )}
        <ThemeToggle />
        <NotificationsBell />
        <button
          type="button"
          onClick={() => void signOut()}
          className="h-10 px-3 rounded-full flex items-center text-on-primary hover:bg-white/10 transition-colors font-label-lg shrink-0"
        >
          Sign out
        </button>
        <Link href="/profile" className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:block text-on-primary font-label-lg text-label-lg truncate max-w-[160px]">
            {user?.fullName || "Rider"}
          </span>
          <span className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0">
            <Avatar src={user?.avatar} alt={user?.fullName ?? "Profile"} size={40} className="w-full h-full" />
          </span>
        </Link>
      </div>
    </header>
  );
}

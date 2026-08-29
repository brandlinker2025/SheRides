"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "../ui/Icon";
import { Avatar } from "../ui/Avatar";

export function TopNav() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-gutter py-base bg-deep-charcoal shadow-nav">
      <div className="flex items-center gap-gutter">
        <Link href="/home" className="font-display-lg text-display-lg-mobile font-bold text-accent-magenta tracking-tight">
          SheRides
        </Link>
        <div className="hidden md:flex items-center bg-surface-container-low/10 rounded-full px-4 py-2 w-64 border border-white/10 focus-within:border-accent-magenta transition-colors">
          <Icon name="search" className="text-on-primary/70 mr-2" />
          <input
            className="bg-transparent border-none text-on-primary placeholder:text-on-primary/50 focus:ring-0 focus:outline-none w-full text-body-sm font-body-sm"
            placeholder="Search SheRides..."
            type="search"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/notifications"
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-primary hover:bg-white/10 transition-colors relative"
          aria-label="Notifications"
        >
          <Icon name="notifications" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent-magenta rounded-full" />
        </Link>
        <Link href="/profile" className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
          <Avatar src={user?.avatar} alt={user?.fullName ?? "Profile"} size={40} className="w-full h-full" />
        </Link>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "../ui/Icon";
import { Avatar } from "../ui/Avatar";
import { ThemeToggle } from "../ui/ThemeToggle";
import { BrandLogo } from "../ui/BrandLogo";
import { NotificationsBell } from "./NotificationsBell";

export function TopNav() {
  const { user, signOut } = useAuth();

  return (
    <header className="panda-topnav fixed top-0 w-full z-50 flex justify-between items-center px-gutter py-base shadow-nav">
      <div className="flex items-center gap-gutter">
        <Link href="/go" aria-label="SheRides home">
          <BrandLogo className="text-[28px] sm:text-[40px]" />
        </Link>
      </div>
      <div className="flex items-center gap-1 sm:gap-4 shrink-0">
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
          aria-label="Sign out"
          className="h-10 px-2 sm:px-3 rounded-full flex items-center gap-1 text-on-primary hover:bg-white/10 transition-colors font-label-lg shrink-0"
        >
          <Icon name="logout" size={22} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
        <Link href="/profile" className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:block text-on-primary font-label-lg text-label-lg truncate max-w-[160px]">
            {user?.fullName || "Rider"}
          </span>
          <span className="avatar-ring w-10 h-10 rounded-full overflow-hidden shrink-0">
            <Avatar src={user?.avatar} alt={user?.fullName ?? "Profile"} size={40} className="w-full h-full" />
          </span>
        </Link>
      </div>
    </header>
  );
}

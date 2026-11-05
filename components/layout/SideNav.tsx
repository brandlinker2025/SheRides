"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { img } from "@/lib/images";
import { useUI } from "@/lib/ui-context";
import { PandaNavBackdrop } from "@/components/brand/PandaNavBackdrop";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";

const items = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/explore", label: "Explore", icon: "explore" },
  { href: "/groups", label: "Groups", icon: "group" },
  { href: "/events", label: "Events & Rides", icon: "event" },
  { href: "/rides", label: "Rides", icon: "motorcycle" },
  { href: "/rider-benefits", label: "Rider Benefits", icon: "workspace_premium" },
  { href: "/notifications", label: "Notifications", icon: "notifications" },
  { href: "/saved", label: "Saved", icon: "bookmark" },
  { href: "/safety", label: "Safety Center", icon: "shield" },
];

export function SideNav() {
  const pathname = usePathname();
  const { setCreateOpen } = useUI();
  const { user } = useAuth();

  return (
    <nav className="hidden lg:flex flex-col h-screen fixed left-0 top-0 w-64 shadow-xl z-40 border-r border-white/10 pt-[96px] pb-6 overflow-hidden">
      <PandaNavBackdrop />
      <div className="relative z-10 px-gutter mb-6">
        {user ? (
          <Link href="/profile" className="flex items-center gap-3 min-w-0 rounded-2xl p-2 -m-2 bg-black/35 backdrop-blur-md border border-white/10 hover:bg-black/50 transition-colors">
            <div className="avatar-ring w-12 h-12 rounded-full overflow-hidden shrink-0">
              <Avatar src={user.avatar} alt={user.fullName} size={48} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <h2 className="font-label-lg text-label-lg text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] truncate">
                {user.fullName || "Rider"}
              </h2>
              <p className="font-body-sm text-body-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">View profile</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent-magenta flex items-center justify-center overflow-hidden shrink-0">
              <img src={img.logo} alt="SheRides crest" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-label-lg text-label-lg text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">SheRides Community</h2>
              <p className="font-body-sm text-body-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">Bangladesh Women Riders Community</p>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 flex-1 flex flex-col gap-1.5 overflow-y-auto hide-scrollbar px-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-pill ${active ? "nav-pill-active" : ""}`}
            >
              <Icon name={item.icon} filled={active} />
              <span className="font-label-lg text-label-lg">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="relative z-10 mt-auto px-4">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="w-full bg-accent-magenta text-white font-label-lg text-label-lg py-3.5 rounded-full inline-flex items-center justify-center gap-2"
        >
          <Icon name="two_wheeler" size={20} />
          Start a Ride
        </button>
      </div>
    </nav>
  );
}

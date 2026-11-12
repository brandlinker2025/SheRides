"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { img } from "@/lib/images";
import { PandaNavBackdrop } from "@/components/brand/PandaNavBackdrop";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";
import { isNavActive, sideNav } from "./nav-items";

export function SideNav() {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  const { user } = useAuth();

  return (
    <nav aria-label="Main navigation" className="hidden lg:flex flex-col h-dvh fixed left-0 top-0 w-64 shadow-xl z-40 border-r border-white/10 pt-[96px] pb-6 overflow-hidden">
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
              <h2 className="font-label-lg text-label-lg text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">SheRides</h2>
              <p className="font-body-sm text-body-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">Rides by women, for women</p>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 flex-1 flex flex-col gap-1.5 overflow-y-auto hide-scrollbar px-4">
        {sideNav.map((item) => {
          const active = isNavActive(item, pathname, tab);
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
        <Link
          href="/go"
          className="w-full bg-accent-magenta text-white font-label-lg text-label-lg py-3.5 rounded-full inline-flex items-center justify-center gap-2"
        >
          <Icon name="two_wheeler" size={20} />
          Book a Ride
        </Link>
      </div>
    </nav>
  );
}

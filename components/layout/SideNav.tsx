"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { sidebarCommunities } from "@/lib/data";
import { img } from "@/lib/images";
import { useUI } from "@/lib/ui-context";
import { PandaNavBackdrop } from "@/components/brand/PandaNavBackdrop";
import { Icon } from "../ui/Icon";

const items = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/explore", label: "Explore", icon: "explore" },
  { href: "/groups", label: "Groups", icon: "group" },
  { href: "/events", label: "Events & Rides", icon: "event" },
  { href: "/rides", label: "Rides", icon: "motorcycle" },
  { href: "/messages", label: "Messages", icon: "chat" },
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-magenta flex items-center justify-center overflow-hidden shrink-0">
            <img src={img.logo} alt="SheRides crest" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="panda-nav-kicker font-label-lg text-label-lg">SheRides Community</h2>
            <p className="panda-nav-kicker font-body-sm text-body-sm">Bangladesh Women Riders Community</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col gap-1 overflow-y-auto px-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`panda-nav-item flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                active ? "panda-nav-item-active" : ""
              }`}
            >
              <Icon name={item.icon} filled={active} />
              <span className="font-label-lg text-label-lg">{item.label}</span>
            </Link>
          );
        })}
        {user?.role === "admin" && (
          <Link
            href="/admin"
            className={`panda-nav-item flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
              pathname.startsWith("/admin") ? "panda-nav-item-active" : ""
            }`}
          >
            <Icon name="admin_panel_settings" filled={pathname.startsWith("/admin")} />
            <span className="font-label-lg text-label-lg">Admin Panel</span>
          </Link>
        )}
      </div>

      <div className="relative z-10 mt-auto px-4">
        <div className="mb-6">
          <h3 className="panda-nav-kicker font-label-caps text-label-caps px-4 mb-2">POPULAR COMMUNITIES</h3>
          {sidebarCommunities.map((c) => (
            <Link
              key={c.name}
              href={c.href}
              className="panda-nav-item flex items-center gap-4 px-4 py-2 rounded-lg transition-all"
            >
              <Icon name="star" />
              <span className="font-body-sm text-body-sm">{c.name}</span>
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="w-full bg-accent-magenta text-white font-label-lg text-label-lg py-3 rounded-full hover:bg-primary-container transition-colors shadow-lg"
        >
          Start a Ride
        </button>
        <LogoutButton />
      </div>
    </nav>
  );
}

function LogoutButton() {
  const { signOut } = useAuth();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/");
      }}
      className="panda-nav-item w-full mt-3 font-body-sm py-2 rounded-full hover:text-red-200 hover:bg-red-950/70 transition-colors flex items-center justify-center gap-2"
    >
      <span>🚪</span> লগআউট
    </button>
  );
}

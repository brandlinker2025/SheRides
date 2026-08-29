"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUI } from "@/lib/ui-context";
import { Icon } from "../ui/Icon";

export function BottomNav() {
  const pathname = usePathname();
  const { setCreateOpen } = useUI();

  const item = (href: string, icon: string, label: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className={`flex flex-col items-center justify-center transition-colors group ${
          active ? "text-accent-magenta" : "text-secondary hover:text-primary"
        }`}
      >
        <Icon
          name={icon}
          filled={active}
          className="text-[28px] mb-1 transition-transform group-hover:-translate-y-1"
        />
        <span className="font-label-caps text-label-caps">{label}</span>
        {active && <span className="absolute -bottom-2 w-1 h-1 bg-accent-magenta rounded-full" />}
      </Link>
    );
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-surface px-4 py-3 rounded-t-xl border-t border-surface-border shadow-bottom-nav pb-safe">
      <div className="relative">{item("/home", "home", "Home")}</div>
      <div className="relative">{item("/explore", "explore", "Explore")}</div>
      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="flex flex-col items-center justify-center text-secondary hover:text-primary transition-colors group"
        aria-label="Create post"
      >
        <Icon name="add_circle" className="text-[32px] mb-1 transition-transform group-hover:scale-110 group-hover:-translate-y-1" />
        <span className="font-label-caps text-label-caps">Post</span>
      </button>
      <Link
        href="/messages"
        className={`relative flex flex-col items-center justify-center transition-colors group ${
          pathname.startsWith("/messages") ? "text-accent-magenta" : "text-secondary hover:text-primary"
        }`}
      >
        <Icon
          name="chat"
          filled={pathname.startsWith("/messages")}
          className="text-[28px] mb-1 transition-transform group-hover:-translate-y-1"
        />
        <span className="font-label-caps text-label-caps">Messages</span>
        <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-accent-magenta rounded-full border-2 border-surface" />
      </Link>
      <div className="relative">{item("/profile", "person", "Profile")}</div>
    </nav>
  );
}

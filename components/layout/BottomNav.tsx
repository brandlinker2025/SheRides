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
        className={`relative flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-full transition-all duration-300 group active:scale-90 ${
          active ? "text-accent-magenta bg-accent-magenta/10" : "text-secondary hover:text-primary"
        }`}
      >
        <Icon
          name={icon}
          filled={active}
          className={`text-[26px] transition-transform duration-300 ${active ? "scale-110" : "group-hover:-translate-y-0.5"}`}
        />
        <span className="font-label-caps text-label-caps">{label}</span>
        {active && (
          <span className="absolute -bottom-1 w-1 h-1 bg-accent-magenta rounded-full animate-scale-in" />
        )}
      </Link>
    );
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-surface px-2 py-2 rounded-t-xl border-t border-surface-border shadow-bottom-nav pb-safe">
      <div className="relative">{item("/home", "home", "Home")}</div>
      <div className="relative">{item("/explore", "explore", "Explore")}</div>
      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="flex flex-col items-center justify-center text-secondary hover:text-primary transition-all duration-300 group active:scale-90"
        aria-label="Create post"
      >
        <Icon name="add_circle" className="text-[32px] mb-1 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1" />
        <span className="font-label-caps text-label-caps">Post</span>
      </button>
      <Link
        href="/messages"
        className={`relative flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-full transition-all duration-300 group active:scale-90 ${
          pathname.startsWith("/messages") ? "text-accent-magenta bg-accent-magenta/10" : "text-secondary hover:text-primary"
        }`}
      >
        <Icon
          name="chat"
          filled={pathname.startsWith("/messages")}
          className={`text-[26px] transition-transform duration-300 ${
            pathname.startsWith("/messages") ? "scale-110" : "group-hover:-translate-y-0.5"
          }`}
        />
        <span className="font-label-caps text-label-caps">Messages</span>
        <span className="absolute top-0 right-2 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-magenta opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-magenta border-2 border-surface" />
        </span>
      </Link>
      <div className="relative">{item("/profile", "person", "Profile")}</div>
    </nav>
  );
}

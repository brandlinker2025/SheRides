"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { PandaNavBackdrop } from "@/components/brand/PandaNavBackdrop";
import { PANDA_HERO_SRC } from "@/lib/brand-art";

const nav = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/admin/emergency-alerts", label: "Emergency Alerts", icon: "sos" },
  { href: "/admin/users", label: "Users", icon: "group" },
  { href: "/admin/user-details", label: "User Details", icon: "badge" },
  { href: "/admin/posts", label: "Posts", icon: "article" },
  { href: "/admin/events", label: "Events", icon: "event" },
  { href: "/admin/verifications", label: "Verifications", icon: "verified_user" },
  { href: "/admin/go", label: "Ride Booking", icon: "two_wheeler" },
];

export function AdminShell({
  children,
  adminName,
  pendingCount = 0,
}: {
  children: React.ReactNode;
  adminName?: string;
  pendingCount?: number;
}) {
  const pathname = usePathname();

  return (
    <div className="panda-app-bg min-h-screen text-on-surface">
      <header className="panda-topnav fixed top-0 w-full z-50 flex justify-between items-center px-gutter py-base md:hidden">
        <BrandLogo suffix="Admin" className="text-[28px]" />
        <Link href="/home" className="text-on-primary/80 font-label-lg text-label-lg">
          App
        </Link>
      </header>
      <nav className="hidden md:flex flex-col h-screen fixed left-0 top-0 pt-8 pb-6 w-64 shadow-xl z-50 overflow-hidden">
        <PandaNavBackdrop />
        <div className="relative z-10 px-6 mb-6">
          <Link href="/home" aria-label="SheRides community home">
            <BrandLogo className="text-[46px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]" />
          </Link>
          <div className="text-white font-label-caps text-label-caps mt-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">Admin Panel</div>
          {adminName && <p className="text-white font-body-sm text-body-sm mt-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{adminName}</p>}
        </div>
        <div className="relative z-10 flex-1 flex flex-col gap-1.5 px-4 overflow-y-auto hide-scrollbar min-h-0">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const showBadge = item.href === "/admin/verifications" && pendingCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-pill font-label-lg ${active ? "nav-pill-active" : ""}`}
              >
                <Icon name={item.icon} filled={active} />
                <span className="flex-1">{item.label}</span>
                {showBadge ? (
                  <span className="min-w-6 h-6 px-1.5 inline-flex items-center justify-center rounded-full bg-white text-accent-magenta text-[11px] font-bold shadow">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
        <div className="relative z-10 px-4 pt-3 mt-2 border-t border-white/10">
          <Link href="/home" className="nav-pill font-label-lg">
            <Icon name="arrow_back" /> Community
          </Link>
        </div>
      </nav>
      <div className="panda-topnav md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around py-3 px-2 overflow-x-auto">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const showBadge = item.href === "/admin/verifications" && pendingCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-w-16 flex-col items-center gap-1 ${active ? "text-white" : "text-on-primary/70"}`}
            >
              <span className="relative">
                <Icon name={item.icon} filled={active} size={22} />
                {showBadge ? (
                  <span className="absolute -right-2 -top-1 min-w-4 h-4 px-1 inline-flex items-center justify-center rounded-full bg-accent-magenta text-white text-[9px] font-label-lg">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                ) : null}
              </span>
              <span className="font-label-caps text-[10px] whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <main className="relative flex-1 mt-16 md:mt-0 md:ml-64 p-container-margin-mobile md:p-container-margin-desktop pb-28 md:pb-container-margin-desktop">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <Image
            src={PANDA_HERO_SRC}
            alt=""
            fill
            sizes="(min-width: 768px) 70vw, 100vw"
            className="object-cover object-[42%_40%] opacity-[0.22]"
          />
          <div className="absolute inset-0 panda-app-veil" />
        </div>
        <div className="relative z-10">{children}</div>
      </main>
    </div>
  );
}

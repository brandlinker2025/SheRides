"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { PandaNavBackdrop } from "@/components/brand/PandaNavBackdrop";
import { useScrollTopOnNavigate } from "@/hooks/useScrollTopOnNavigate";

const nav = [
  { href: "/admin/go", label: "Approvals", icon: "fact_check" },
  { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/admin/verifications", label: "New Joins", icon: "verified_user" },
  { href: "/admin/users", label: "Accounts", icon: "group" },
  { href: "/admin/user-details", label: "Contacts", icon: "badge" },
];

export function AdminShell({
  children,
  adminName,
  pendingCount = 0,
  queueCount = 0,
}: {
  children: React.ReactNode;
  adminName?: string;
  pendingCount?: number;
  queueCount?: number;
}) {
  const pathname = usePathname();
  const mainRef = useScrollTopOnNavigate<HTMLElement>();

  return (
    <div className="panda-app-bg h-dvh overflow-hidden text-on-surface">
      <header className="panda-topnav fixed top-0 w-full z-50 flex justify-between items-center px-gutter py-base md:hidden">
        <Logo variant="mark" height={40} suffix="Admin" />
        <Link href="/go" className="text-on-primary/80 font-label-lg text-label-lg">
          App
        </Link>
      </header>
      <nav aria-label="Admin navigation" className="hidden md:flex flex-col h-dvh fixed left-0 top-0 pt-8 pb-6 w-64 shadow-xl z-50 overflow-hidden">
        <PandaNavBackdrop />
        <div className="relative z-10 px-6 mb-6">
          <Link href="/go" aria-label="SheRides ride booking">
            <Logo variant="mark" height={64} priority />
          </Link>
          <div className="text-white font-label-caps text-label-caps mt-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">Admin Panel</div>
          {adminName && <p className="text-white font-body-sm text-body-sm mt-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{adminName}</p>}
        </div>
        <div className="relative z-10 flex-1 flex flex-col gap-1.5 px-4 overflow-y-auto hide-scrollbar min-h-0">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const badge = item.href === "/admin/go" ? queueCount : item.href === "/admin/verifications" ? pendingCount : 0;
            const showBadge = badge > 0;
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
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
        <div className="relative z-10 px-4 pt-3 mt-2 border-t border-white/10">
          <Link href="/go" className="nav-pill font-label-lg">
            <Icon name="arrow_back" /> Ride app
          </Link>
        </div>
      </nav>
      <div className="panda-topnav md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around py-3 px-2 overflow-x-auto">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const badge = item.href === "/admin/go" ? queueCount : item.href === "/admin/verifications" ? pendingCount : 0;
          const showBadge = badge > 0;
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
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </span>
              <span className="font-label-caps text-[10px] whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Background art stays put while only the content scrolls */}
      <div className="pointer-events-none fixed inset-0 md:left-64 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 panda-app-veil" />
      </div>
      {/* Sidebar is fixed; this is the ONLY scrolling area */}
      <main
        id="admin-main"
        ref={mainRef}
        className="relative z-10 h-dvh overflow-y-auto overscroll-contain md:ml-64 pt-20 md:pt-0"
      >
        <div className="p-container-margin-mobile md:p-container-margin-desktop pb-28 md:pb-container-margin-desktop">
          {children}
        </div>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import "@/components/public-app/public-app.css";

const nav = [
  { href: "/admin/go", label: "Approvals", short: "Approvals", icon: "fact_check", moderator: true },
  { href: "/admin/places", label: "Places", short: "Places", icon: "add_location_alt", moderator: true },
  { href: "/admin", label: "Dashboard", short: "Home", icon: "dashboard", exact: true },
  { href: "/admin/verifications", label: "New Joins", short: "Joins", icon: "verified_user" },
  { href: "/admin/users", label: "Accounts", short: "Accounts", icon: "group" },
  { href: "/admin/user-details", label: "Contacts", short: "Contacts", icon: "badge" },
];

export function AdminShell({
  children,
  adminName,
  role = "admin",
  pendingCount = 0,
  queueCount = 0,
}: {
  children: React.ReactNode;
  adminName?: string;
  role?: "admin" | "moderator";
  pendingCount?: number;
  queueCount?: number;
}) {
  const pathname = usePathname();
  const items = role === "moderator" ? nav.filter((item) => "moderator" in item) : nav;
  const isMod = role === "moderator";
  const count = (href: string) => (href === "/admin/go" ? queueCount : href === "/admin/verifications" ? pendingCount : 0);
  const active = (item: (typeof nav)[number]) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));
  const label = isMod ? "Moderator" : "Main admin";

  return (
    <div className="admin-app text-on-surface">
      <aside className="admin-side" aria-label="Admin navigation">
        <div className="admin-brand">
          <Link href="/" aria-label="SheRides home">
            <Logo variant="lockup" tone="light" height={92} priority />
          </Link>
          <span className={`admin-role ${isMod ? "is-mod" : ""}`}>
            <Icon name={isMod ? "support_agent" : "shield_person"} size={16} /> {label}
          </span>
          {adminName && <p className="admin-name">{adminName}</p>}
        </div>
        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto hide-scrollbar">
          {items.map((item) => {
            const n = count(item.href);
            return (
              <Link key={item.href} href={item.href} className={`admin-link ${active(item) ? "is-active" : ""}`}>
                <Icon name={item.icon} filled={active(item)} size={22} />
                <span>{item.label}</span>
                {n > 0 && <span className="admin-count">{n > 99 ? "99+" : n}</span>}
              </Link>
            );
          })}
        </nav>
        <Link href="/" className="admin-link">
          <Icon name="arrow_back" size={22} /> SheRides app
        </Link>
      </aside>

      <header className="admin-top">
        <Logo variant="mark" tone="light" height={40} />
        <span className={`admin-role ${isMod ? "is-mod" : ""}`}>
          <Icon name={isMod ? "support_agent" : "shield_person"} size={16} /> {label}
        </span>
      </header>

      <main id="admin-main" className="admin-main">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      {items.length > 1 && (
        <nav className="admin-tabs" aria-label="Admin sections">
          {items.map((item) => {
            const n = count(item.href);
            return (
              <Link key={item.href} href={item.href} className={`admin-tab ${active(item) ? "is-active" : ""}`}>
                <Icon name={item.icon} filled={active(item)} size={22} />
                <span>{item.short}</span>
                {n > 0 && <span className="admin-count">{n > 99 ? "99+" : n}</span>}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

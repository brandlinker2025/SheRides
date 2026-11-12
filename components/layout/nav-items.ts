export type NavItem = { href: string; label: string; icon: string; tab?: string };

/** Ride-sharing only: every destination is about booking, riding or staying safe. */
export const primaryNav: NavItem[] = [
  { href: "/go", label: "Book", icon: "two_wheeler" },
  { href: "/go?tab=rides", label: "My rides", icon: "history", tab: "rides" },
  { href: "/safety", label: "Safety", icon: "shield" },
  { href: "/profile", label: "Profile", icon: "person" },
];

export const sideNav: NavItem[] = [
  { href: "/go", label: "Book a Ride", icon: "two_wheeler" },
  { href: "/go?tab=rides", label: "My Rides", icon: "history", tab: "rides" },
  { href: "/go?tab=rider", label: "Rider Mode", icon: "sports_motorsports", tab: "rider" },
  { href: "/notifications", label: "Notifications", icon: "notifications" },
  { href: "/safety", label: "Safety Center", icon: "shield" },
  { href: "/profile", label: "Profile", icon: "person" },
];

export function isNavActive(item: NavItem, pathname: string, tab: string | null) {
  const base = item.href.split("?")[0];
  if (base === "/go") {
    if (!(pathname === "/go" || pathname.startsWith("/go/"))) return false;
    const current = pathname === "/go" && (tab === "rides" || tab === "rider") ? tab : null;
    return (item.tab ?? null) === current;
  }
  return pathname === base || pathname.startsWith(`${base}/`);
}

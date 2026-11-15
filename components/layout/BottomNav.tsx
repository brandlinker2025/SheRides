"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useLocale, type CopyKey } from "@/lib/locale";
import { Icon } from "../ui/Icon";
import { isNavActive, primaryNav } from "./nav-items";

const SHORT: Record<string, CopyKey> = {
  "/go": "nav.book",
  "/go?tab=rides": "nav.rides",
  "/go?tab=rider": "nav.rider",
  "/notifications": "nav.alerts",
  "/places": "nav.places",
  "/profile": "nav.profile",
};

const LONG: Record<string, CopyKey> = {
  "/go": "nav.bookLong",
  "/go?tab=rides": "nav.ridesLong",
  "/go?tab=rider": "nav.riderLong",
  "/notifications": "nav.alertsLong",
  "/places": "nav.placesLong",
  "/profile": "nav.profileLong",
};

function Items() {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  const { t } = useLocale();
  return (
    <>
      {primaryNav.map((item) => {
        const active = isNavActive(item, pathname, tab);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={t(LONG[item.href] ?? "nav.book")}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-0.5 py-1 transition-all duration-300 active:scale-90 ${
              active ? "text-accent-magenta bg-accent-magenta/10" : "text-secondary hover:text-primary"
            }`}
          >
            <Icon name={item.icon} filled={active} className="text-[22px]" />
            <span className="max-w-full truncate text-[10px] font-bold uppercase tracking-wide">{t(SHORT[item.href] ?? "nav.book")}</span>
          </Link>
        );
      })}
    </>
  );
}

export function BottomNav() {
  return (
    <nav
      aria-label="Main navigation"
      className="panda-bottomnav lg:hidden fixed bottom-0 left-0 z-50 flex w-full max-w-[100vw] items-stretch justify-between rounded-t-xl border-t px-1 py-1.5 shadow-bottom-nav pb-safe"
    >
      <Suspense fallback={null}>
        <Items />
      </Suspense>
    </nav>
  );
}

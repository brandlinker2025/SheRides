"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "../ui/Icon";
import { isNavActive, primaryNav } from "./nav-items";

function Items() {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  return (
    <>
      {primaryNav.map((item) => {
        const active = isNavActive(item, pathname, tab);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-w-[64px] flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-full transition-all duration-300 active:scale-90 ${
              active ? "text-accent-magenta bg-accent-magenta/10" : "text-secondary hover:text-primary"
            }`}
          >
            <Icon name={item.icon} filled={active} className="text-[26px]" />
            <span className="font-label-caps text-label-caps whitespace-nowrap">{item.label}</span>
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
      className="panda-bottomnav lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 rounded-t-xl border-t shadow-bottom-nav pb-safe"
    >
      <Suspense fallback={null}>
        <Items />
      </Suspense>
    </nav>
  );
}

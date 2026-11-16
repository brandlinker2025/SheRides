"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/ui/Logo";
import { PandaNavBackdrop } from "@/components/brand/PandaNavBackdrop";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";
import { useLocale, type CopyKey } from "@/lib/locale";
import { isNavActive, sideNav } from "./nav-items";

const LABEL: Record<string, CopyKey> = {
  "/go": "nav.bookLong",
  "/go?tab=rides": "nav.ridesLong",
  "/go?tab=rider": "nav.riderLong",
  "/partner": "nav.partner",
  "/notifications": "nav.alertsLong",
  "/places": "nav.placesLong",
  "/profile": "nav.profileLong",
};

export function SideNav() {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  const { user } = useAuth();
  const { t } = useLocale();

  return (
    <nav aria-label="Main navigation" className="hidden lg:flex flex-col h-dvh fixed left-0 top-0 w-64 shadow-xl z-40 border-r border-white/10 pt-[6.5rem] pb-6 overflow-hidden">
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
          <Logo variant="mark" height={84} />
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
              <span className="font-label-lg text-label-lg">{t(LABEL[item.href] ?? "nav.bookLong")}</span>
            </Link>
          );
        })}
      </div>

      <div className="relative z-10 mt-auto px-4">
        <Link
          href="/go"
          className="btn btn-primary w-full"
        >
          <Icon name="two_wheeler" size={20} />
          {t("nav.bookLong")}
        </Link>
      </div>
    </nav>
  );
}

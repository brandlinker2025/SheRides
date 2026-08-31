"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { PandaHeroBanner } from "@/components/brand/PandaHeroBanner";
import { PandaNavBackdrop } from "@/components/brand/PandaNavBackdrop";
import { PANDA_HERO_SRC } from "@/lib/brand-art";

const nav = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/admin/users", label: "Users", icon: "group" },
  { href: "/admin/posts", label: "Posts", icon: "article" },
  { href: "/admin/events", label: "Events", icon: "event" },
  { href: "/admin/verifications", label: "Verifications", icon: "verified_user" },
];

export function AdminShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName?: string;
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
      <nav className="hidden md:flex flex-col h-screen fixed left-0 top-0 py-section-gap w-64 shadow-xl z-50 overflow-hidden">
        <PandaNavBackdrop />
        <div className="relative z-10 px-base mb-section-gap">
          <Link href="/home" aria-label="SheRides community home">
            <BrandLogo className="text-[46px]" />
          </Link>
          <div className="text-on-primary opacity-70 font-label-caps text-label-caps mt-2">Admin Panel</div>
          {adminName && <p className="text-on-primary/50 font-body-sm text-body-sm mt-2">{adminName}</p>}
        </div>
        <div className="relative z-10 flex-1 flex flex-col gap-2 px-4">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 p-3 rounded-lg font-label-lg ${
                  active
                    ? "text-accent-magenta font-bold border-r-4 border-accent-magenta bg-white/15"
                    : "text-on-primary opacity-80 hover:bg-white/10"
                }`}
              >
                <Icon name={item.icon} filled={active} /> {item.label}
              </Link>
            );
          })}
        </div>
        <div className="relative z-10 px-4">
          <Link
            href="/home"
            className="flex items-center gap-4 p-3 rounded-lg text-on-primary opacity-80 hover:bg-white/10 font-label-lg"
          >
            <Icon name="arrow_back" /> Community
          </Link>
        </div>
      </nav>
      <div className="panda-topnav md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around py-3 px-2">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${active ? "text-white" : "text-on-primary/70"}`}
            >
              <Icon name={item.icon} filled={active} size={22} />
              <span className="font-label-caps text-[10px]">{item.label}</span>
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
        <div className="relative z-10 mb-6">
          <PandaHeroBanner />
        </div>
        <div className="relative z-10">{children}</div>
      </main>
    </div>
  );
}

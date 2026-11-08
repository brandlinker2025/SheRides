"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId } from "react";
import { useAuth } from "@/lib/auth-context";
import { img } from "@/lib/images";
import { useUI } from "@/lib/ui-context";
import { PandaNavBackdrop } from "@/components/brand/PandaNavBackdrop";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";

const items = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/go", label: "Book a Ride", icon: "two_wheeler" },
  { href: "/explore", label: "Explore", icon: "explore" },
  { href: "/groups", label: "Groups", icon: "group" },
  { href: "/events", label: "Events & Rides", icon: "event" },
  { href: "/rides", label: "Rides", icon: "motorcycle" },
  { href: "/rider-benefits", label: "Rider Benefits", icon: "workspace_premium" },
  { href: "/notifications", label: "Notifications", icon: "notifications" },
  { href: "/saved", label: "Saved", icon: "bookmark" },
  { href: "/safety", label: "Safety Center", icon: "shield" },
];

export function SideNav() {
  const pathname = usePathname();
  const { setCreateOpen, navOpen, setNavOpen } = useUI();
  const { user } = useAuth();
  const mobileTitleId = useId();

  useEffect(() => {
    setNavOpen(false);
  }, [pathname, setNavOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const root = document.getElementById("mobile-nav");
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () =>
      root
        ? Array.from(root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")).filter(
            (element) => !element.hasAttribute("disabled")
          )
        : [];
    focusable()[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setNavOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusableItems = focusable();
      if (focusableItems.length === 0) return;
      const first = focusableItems[0];
      const last = focusableItems[focusableItems.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [navOpen, setNavOpen]);

  const linkItems = items.map((item) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return { ...item, active };
  });

  return (
    <>
    <nav aria-label="Main navigation" className="hidden lg:flex flex-col h-dvh fixed left-0 top-0 w-64 shadow-xl z-40 border-r border-white/10 pt-[96px] pb-6 overflow-hidden">
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
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent-magenta flex items-center justify-center overflow-hidden shrink-0">
              <img src={img.logo} alt="SheRides crest" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-label-lg text-label-lg text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">SheRides Community</h2>
              <p className="font-body-sm text-body-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">Bangladesh Women Riders Community</p>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 flex-1 flex flex-col gap-1.5 overflow-y-auto overscroll-contain hide-scrollbar px-4 min-h-0">
        {linkItems.map((item) => (
          <Link key={item.href} href={item.href} className={`nav-pill ${item.active ? "nav-pill-active" : ""}`}>
            <Icon name={item.icon} filled={item.active} />
            <span className="font-label-lg text-label-lg">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="relative z-10 mt-auto px-4">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="w-full bg-accent-magenta text-white font-label-lg text-label-lg py-3.5 rounded-full inline-flex items-center justify-center gap-2"
        >
          <Icon name="two_wheeler" size={20} />
          Start a Ride
        </button>
      </div>
    </nav>
    {navOpen ? (
      <div className="lg:hidden fixed inset-0 z-[80]">
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
        <nav
          id="mobile-nav"
          aria-labelledby={mobileTitleId}
          className="absolute inset-y-0 left-0 flex w-[min(100%,20rem)] max-w-full flex-col overflow-hidden border-r border-white/10 shadow-xl"
        >
          <PandaNavBackdrop />
          <div className="relative z-10 flex items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
            <h2 id={mobileTitleId} className="font-label-lg text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              Menu
            </h2>
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="inline-flex h-10 items-center rounded-full px-3 text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>
          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-1.5">
              {linkItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-pill ${item.active ? "nav-pill-active" : ""}`}
                  onClick={() => setNavOpen(false)}
                >
                  <Icon name={item.icon} filled={item.active} />
                  <span className="font-label-lg text-label-lg">{item.label}</span>
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setNavOpen(false);
                setCreateOpen(true);
              }}
              className="mt-4 w-full bg-accent-magenta text-white font-label-lg text-label-lg py-3.5 rounded-full inline-flex items-center justify-center gap-2"
            >
              <Icon name="two_wheeler" size={20} />
              Start a Ride
            </button>
          </div>
        </nav>
      </div>
    ) : null}
    </>
  );
}

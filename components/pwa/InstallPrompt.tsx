"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "../ui/Icon";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "sherides-install-dismissed-at";
const DISMISS_DAYS = 7;

export function InstallPrompt() {
  const pathname = usePathname();
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const coversAForm =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/admin-login" ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/auth");
  const aboveAppNav = pathname.startsWith("/go") || pathname.startsWith("/places") || pathname.startsWith("/profile") || pathname.startsWith("/notifications");

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const take = (e: BeforeInstallPromptEvent) => {
      try {
        const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
        const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
        if (dismissedAt && daysSince < DISMISS_DAYS) return;
      } catch {
        /* storage unavailable */
      }
      setEvent(e);
    };
    const queued = (window as Window & { __sheridesBIP?: BeforeInstallPromptEvent }).__sheridesBIP;
    if (queued) take(queued);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      take(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage unavailable */
    }
  };

  if (!event || hidden || !isMobile || coversAForm) return null;

  return (
    <div className={`panda-install-prompt fixed left-4 right-4 z-[70] max-w-sm rounded-xl bg-white shadow-[var(--sr-shadow)] p-4 text-[var(--sr-ink)] shadow-premium-hover flex items-center gap-3 animate-fade-in-up ${aboveAppNav ? "bottom-24" : "bottom-4"}`}>
      <Logo variant="badge" height={40} />
      <div className="flex-1 min-w-0">
        <p className="font-label-lg text-label-lg">Install SheRides</p>
        <p className="font-body-sm text-body-sm text-[var(--sr-muted)]">Add to your home screen for ride-ready access.</p>
      </div>
      <button
        type="button"
        className="font-label-lg text-label-lg text-accent-magenta transition-transform hover:scale-105 active:scale-95"
        onClick={async () => {
          await event.prompt();
          setHidden(true);
        }}
      >
        Install
      </button>
      <button type="button" onClick={dismiss} className="text-[var(--sr-muted)] hover:text-[var(--sr-heading)] transition-colors" aria-label="Dismiss">
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}

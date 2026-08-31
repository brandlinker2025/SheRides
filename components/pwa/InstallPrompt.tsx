"use client";

import { useEffect, useState } from "react";
import { Icon } from "../ui/Icon";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "sherides-install-dismissed-at";
const DISMISS_DAYS = 7;

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  if (!event || hidden || !isMobile) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 z-[70] max-w-sm bg-deep-charcoal text-on-primary rounded-xl shadow-premium-hover p-4 flex items-center gap-3 animate-fade-in-up">
      <div className="w-10 h-10 rounded-full bg-accent-magenta flex items-center justify-center shrink-0">
        <Icon name="install_mobile" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-label-lg text-label-lg">Install SheRides</p>
        <p className="font-body-sm text-body-sm text-white/70">Add to your home screen for ride-ready access.</p>
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
      <button type="button" onClick={dismiss} className="text-white/60 hover:text-white transition-colors" aria-label="Dismiss">
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Icon } from "../ui/Icon";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!event || hidden) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 z-[70] max-w-sm bg-deep-charcoal text-on-primary rounded-xl shadow-premium-hover p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-accent-magenta flex items-center justify-center">
        <Icon name="install_mobile" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-label-lg text-label-lg">Install SheRides</p>
        <p className="font-body-sm text-body-sm text-white/70">Add to your home screen for ride-ready access.</p>
      </div>
      <button
        type="button"
        className="font-label-lg text-label-lg text-accent-magenta"
        onClick={async () => {
          await event.prompt();
          setHidden(true);
        }}
      >
        Install
      </button>
      <button type="button" onClick={() => setHidden(true)} className="text-white/60" aria-label="Dismiss">
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}

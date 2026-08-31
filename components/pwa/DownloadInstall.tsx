"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";

type Target = "sherides" | "admin";
type Platform = "ios" | "android" | "desktop";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const TARGETS: {
  id: Target;
  href: string;
  name: string;
  eyebrow: string;
  description: string;
  openHref: string;
  openLabel: string;
}[] = [
  {
    id: "sherides",
    href: "/download",
    name: "SheRides",
    eyebrow: "Community",
    description: "Rides, feed, and messages. Opens at your community home.",
    openHref: "/",
    openLabel: "Open in browser",
  },
  {
    id: "admin",
    href: "/download?app=admin",
    name: "Admin",
    eyebrow: "Dashboard",
    description: "Manage riders, posts, events, and verifications.",
    openHref: "/admin",
    openLabel: "Open admin",
  },
];

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    Boolean(nav.standalone)
  );
}

function isSafariBrowser() {
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|Android/i.test(ua) && !/Chrome|Edg|OPR/i.test(ua);
}

export function DownloadInstall({ target }: { target: Target }) {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [justInstalled, setJustInstalled] = useState(false);
  const [safari, setSafari] = useState(true);
  const iosRef = useRef<HTMLElement>(null);
  const fallbackRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setStandalone(isStandaloneDisplay());
    setSafari(isSafariBrowser());

    const queued = (window as Window & { __sheridesBIP?: BeforeInstallPromptEvent }).__sheridesBIP;
    if (queued) setInstallEvent(queued);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setJustInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    const href = target === "admin" ? "/admin.webmanifest" : "/manifest.webmanifest";
    const links = document.querySelectorAll('link[rel="manifest"]');
    if (links.length === 0) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = href;
      document.head.appendChild(link);
      return;
    }
    links.forEach((link, index) => {
      if (index === 0) link.setAttribute("href", href);
      else link.parentElement?.removeChild(link);
    });
  }, [target]);

  const selected = TARGETS.find((item) => item.id === target) ?? TARGETS[0];

  const install = async () => {
    if (platform === "ios") {
      iosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setHint("Use Safari’s Share menu to Add to Home Screen.");
      return;
    }
    if (installEvent) {
      setBusy(true);
      try {
        await installEvent.prompt();
        const choice = await installEvent.userChoice;
        if (choice.outcome === "accepted") setJustInstalled(true);
        setInstallEvent(null);
      } catch {
        setHint("Install was cancelled. You can also use the browser menu.");
      } finally {
        setBusy(false);
      }
      return;
    }
    fallbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setHint(
      platform === "android"
        ? "If Install does not appear, open the Chrome menu and tap Install app."
        : "If Install does not appear, use the install icon in the address bar, or the browser menu.",
    );
  };

  const installLabel = platform === "ios" ? "Show iPhone steps" : `Install ${selected.name}`;

  return (
    <section className="w-full rounded-xl bg-surface-container-lowest p-6 shadow-premium sm:p-8">
      <Link href="/" className="mb-6 inline-block" aria-label="SheRides home">
        <BrandLogo className="text-[42px]" />
      </Link>
      <p className="mb-2 font-label-lg text-accent-magenta">INSTALL THE APP</p>
      <h1 className="mb-2 font-headline-xl text-headline-xl">Ride from your home screen</h1>
      <p className="mb-6 font-body-sm text-secondary">
        Install SheRides on a PC, laptop, Android phone, or iPhone. No App Store, Play Store, or extra package —
        this is a Home Screen / desktop web app.
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {TARGETS.map((item) => {
          const active = item.id === target;
          return (
            <article
              key={item.id}
              className={`flex flex-col rounded-2xl border-2 p-4 transition-all ${
                active
                  ? "border-accent-magenta bg-primary-fixed/70 shadow-magenta"
                  : "border-surface-border bg-soft-off-white"
              }`}
            >
              <div className="mb-3 flex items-center gap-3">
                <Image
                  src="/images/panda/idle.png"
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-2xl bg-accent-magenta object-cover"
                />
                <div>
                  <p className="font-label-caps text-label-caps text-accent-magenta">{item.eyebrow}</p>
                  <h2 className="font-headline-md text-headline-md">{item.name}</h2>
                </div>
              </div>
              <p className="mb-4 flex-1 font-body-sm text-secondary">{item.description}</p>
              {active ? (
                <button
                  type="button"
                  onClick={() => void install()}
                  disabled={busy || standalone || justInstalled}
                  className="flex h-12 items-center justify-center rounded-full bg-accent-magenta px-6 font-label-lg text-label-lg text-on-primary shadow-magenta transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                >
                  {standalone || justInstalled ? "Installed" : busy ? "Installing…" : installLabel}
                </button>
              ) : (
                <a
                  href={item.href}
                  className="flex h-12 items-center justify-center rounded-full border-2 border-outline px-6 font-label-lg text-label-lg text-on-surface transition-colors hover:border-deep-charcoal hover:bg-surface-container-low"
                >
                  Install {item.name}
                </a>
              )}
              <Link href={item.openHref} className="mt-3 text-center font-body-sm text-accent-magenta hover:underline">
                {item.openLabel}
              </Link>
            </article>
          );
        })}
      </div>

      {hint && (
        <p className="mb-6 rounded-lg bg-primary-fixed px-4 py-3 font-body-sm text-on-surface" role="status">
          {hint}
        </p>
      )}

      {(standalone || justInstalled) && (
        <p className="mb-6 rounded-lg bg-primary-fixed px-4 py-3 font-body-sm" role="status">
          {selected.name} is ready on this device.{" "}
          <Link href={target === "admin" ? "/admin" : "/home"} className="font-label-lg text-accent-magenta hover:underline">
            Open it
          </Link>
          .
        </p>
      )}

      <section
        ref={fallbackRef}
        id="computer-android"
        className={`mb-6 rounded-2xl p-5 ${platform !== "ios" ? "bg-primary-fixed/80" : "bg-soft-off-white"}`}
      >
        <div className="mb-3 flex items-center gap-2">
          <Icon name={platform === "android" ? "install_mobile" : "install_desktop"} className="text-accent-magenta" />
          <h2 className="font-headline-md text-headline-md">PC, Mac, and Android</h2>
        </div>
        <p className="mb-3 font-body-sm text-secondary">
          Select SheRides or Admin above, then use the Install button. Chrome, Edge, and Samsung Internet can add a real
          app window (standalone).
        </p>
        <ol className="list-decimal space-y-2 pl-5 font-body-sm text-on-surface">
          <li>Choose SheRides (community) or Admin on this page.</li>
          <li>Tap or click <strong>Install</strong> when the browser offers it.</li>
          <li>
            If no prompt appears, open the browser menu and choose <strong>Install app</strong> or look for the install
            icon in the address bar.
          </li>
        </ol>
        {installEvent && platform !== "ios" && (
          <button
            type="button"
            onClick={() => void install()}
            className="mt-4 inline-flex h-11 items-center rounded-full bg-accent-magenta px-5 font-label-lg text-on-primary shadow-magenta"
          >
            Install {selected.name} now
          </button>
        )}
      </section>

      <section
        ref={iosRef}
        id="iphone-steps"
        className={`rounded-2xl p-5 ${platform === "ios" ? "bg-primary-fixed/80" : "bg-soft-off-white"}`}
      >
        <div className="mb-3 flex items-center gap-2">
          <Icon name="ios_share" className="text-accent-magenta" />
          <h2 className="font-headline-md text-headline-md">iPhone</h2>
        </div>
        <p className="mb-3 font-body-sm text-secondary">
          iPhone installs from Safari’s Add to Home Screen — not the App Store. Select SheRides or Admin above first,
          then:
        </p>
        <ol className="list-decimal space-y-2 pl-5 font-body-sm text-on-surface">
          <li>
            Open this page in <strong>Safari</strong>
            {platform === "ios" && !safari ? " (this browser cannot add it — tap Share → Open in Safari)" : ""}.
          </li>
          <li>
            Tap the <strong>Share</strong> button{" "}
            <Icon name="ios_share" size={18} className="align-middle text-accent-magenta" /> (square with an arrow).
          </li>
          <li>
            Scroll and tap <strong>Add to Home Screen</strong>.
          </li>
          <li>
            Tap <strong>Add</strong>. {selected.name} appears on your Home Screen and opens in its own window.
          </li>
        </ol>
      </section>
    </section>
  );
}

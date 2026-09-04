"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
];

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouch = navigator.maxTouchPoints || 0;
  // iPhone/iPad "Request Desktop Website" spoofs Macintosh; maxTouchPoints still gives it away.
  const touchMac =
    maxTouch > 1 && (/Mac/i.test(platform) || /Macintosh|Mac OS X/i.test(ua));
  if (/iPhone|iPad|iPod/i.test(ua) || touchMac) {
    return "ios";
  }
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
}

function isSafariBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|Android/i.test(ua) && !/Chrome|Edg|OPR/i.test(ua);
}

function needsSafariHomeScreenGuide() {
  if (typeof navigator === "undefined") return false;
  return detectPlatform() === "ios" || isSafariBrowser();
}

const INSTALL_PROMPT_WAIT_MS = 1500;

export function DownloadInstall({ target }: { target: Target }) {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [justInstalled, setJustInstalled] = useState(false);
  const [safari, setSafari] = useState(true);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const fallbackRef = useRef<HTMLElement>(null);
  const installEventRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setStandalone(isStandaloneDisplay());
    setSafari(isSafariBrowser());

    const queued = (window as Window & { __sheridesBIP?: BeforeInstallPromptEvent }).__sheridesBIP;
    if (queued) {
      installEventRef.current = queued;
      setInstallEvent(queued);
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      const bip = event as BeforeInstallPromptEvent;
      installEventRef.current = bip;
      setInstallEvent(bip);
    };
    const onInstalled = () => {
      setJustInstalled(true);
      installEventRef.current = null;
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

  const installUrl = () => {
    if (typeof window === "undefined") return "https://sherides.online/download";
    return window.location.href;
  };

  const copyInstallLink = async () => {
    const url = installUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      return;
    } catch {
      /* fall through */
    }
    try {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
    } catch {
      setHint(url);
    }
  };

  const showIosGuide = () => {
    setBusy(false);
    setCopied(false);
    setHint(null);
    setPlatform(detectPlatform());
    setSafari(isSafariBrowser());
    setIosGuideOpen(true);
    document.getElementById("iphone-steps")?.scrollIntoView({ block: "nearest" });
  };

  const queuedInstallEvent = () =>
    installEventRef.current ??
    (window as Window & { __sheridesBIP?: BeforeInstallPromptEvent }).__sheridesBIP ??
    null;

  const promptNativeInstall = async (event: BeforeInstallPromptEvent) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const promptPromise = event.prompt();
    void promptPromise.catch(() => undefined);
    setBusy(true);
    try {
      await Promise.race([
        promptPromise,
        new Promise<void>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("install-prompt-timeout")), INSTALL_PROMPT_WAIT_MS);
        }),
      ]);
    } catch {
      showIosGuide();
      return;
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      setBusy(false);
    }
    try {
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") setJustInstalled(true);
      installEventRef.current = null;
      setInstallEvent(null);
    } catch {
      showIosGuide();
    }
  };

  const install = async () => {
    // Safari has no beforeinstallprompt. Never sit on Installing… — show A2HS steps.
    try {
      if (needsSafariHomeScreenGuide()) {
        showIosGuide();
        return;
      }
      const event = queuedInstallEvent();
      if (!event) {
        showIosGuide();
        return;
      }
      await promptNativeInstall(event);
    } catch {
      showIosGuide();
    }
  };

  const installLabel = `Install ${selected.name}`;

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

      <div className="mb-8 grid gap-4 sm:max-w-md">
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
          Use the Install button above. Chrome, Edge, and Samsung Internet can add a real app window (standalone).
        </p>
        <ol className="list-decimal space-y-2 pl-5 font-body-sm text-on-surface">
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
        id="iphone-steps"
        className={`rounded-2xl p-5 ${platform === "ios" ? "bg-primary-fixed/80" : "bg-soft-off-white"}`}
      >
        <div className="mb-3 flex items-center gap-2">
          <Icon name="ios_share" className="text-accent-magenta" />
          <h2 className="font-headline-md text-headline-md">iPhone</h2>
        </div>
        <p className="mb-3 font-body-sm text-secondary">
          iPhone installs from Safari’s Add to Home Screen — not the App Store. Then:
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

      {iosGuideOpen &&
        createPortal(
        <div
          className="fixed inset-0 z-[200] flex flex-col bg-surface text-on-surface"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
        >
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <p className="font-label-lg text-accent-magenta">INSTALL ON IPHONE</p>
            <button
              type="button"
              onClick={() => setIosGuideOpen(false)}
              className="rounded-full p-2 text-secondary hover:bg-surface-container-low"
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8">
            <h2 id="ios-install-title" className="mb-3 font-headline-xl text-headline-xl">
              Add to Home Screen
            </h2>
            <p className="mb-8 font-body-md text-secondary">
              {safari
                ? "iPhone installs from Safari’s Add to Home Screen — not the App Store."
                : "This browser cannot add SheRides to your Home Screen. Open this page in Safari."}
            </p>
            <ol className="mb-10 space-y-6 font-body-md text-on-surface">
              <li className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-magenta font-label-lg text-on-primary">
                  1
                </span>
                <span className="pt-1.5">
                  Open this page in <strong>Safari</strong>
                  {platform === "ios" && !safari ? " (this browser cannot add it — tap Share → Open in Safari)" : ""}.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-magenta font-label-lg text-on-primary">
                  2
                </span>
                <span className="pt-1.5">
                  Tap the <strong>Share</strong> button{" "}
                  <Icon name="ios_share" size={22} className="align-middle text-accent-magenta" /> (square with an
                  arrow).
                </span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-magenta font-label-lg text-on-primary">
                  3
                </span>
                <span className="pt-1.5">
                  Scroll and tap <strong>Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-magenta font-label-lg text-on-primary">
                  4
                </span>
                <span className="pt-1.5">
                  Tap <strong>Add</strong>. {selected.name} appears on your Home Screen and opens in its own window.
                </span>
              </li>
            </ol>
            <button
              type="button"
              onClick={() => void copyInstallLink()}
              className="flex h-12 items-center justify-center rounded-full border-2 border-outline px-6 font-label-lg text-on-surface"
            >
              {copied ? "Link copied" : "Copy link"}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}

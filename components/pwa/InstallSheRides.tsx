"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { brandAssetPath } from "@/lib/brand-assets";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Device = "android" | "ios" | "desktop";

const SHARE_URL = "https://sherides.online/install";
const CHROME_INTENT =
  "intent://sherides.online/install#Intent;scheme=https;package=com.android.chrome;" +
  "S.browser_fallback_url=https%3A%2F%2Fsherides.online%2Finstall;end";
const ANY_BROWSER_INTENT = "intent://sherides.online/install#Intent;scheme=https;action=android.intent.action.VIEW;end";

function detect() {
  const ua = navigator.userAgent || "";
  const touchMac = (navigator.maxTouchPoints || 0) > 1 && /Macintosh|Mac OS X/i.test(ua);
  const device: Device = /iPhone|iPad|iPod/i.test(ua) || touchMac ? "ios" : /Android/i.test(ua) ? "android" : "desktop";
  const inApp = /FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|WhatsApp|Line\/|Snapchat|musical_ly|Bytedance|TikTok|imo/i.test(ua);
  const iosSafari = device === "ios" && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA/i.test(ua) && !inApp;
  const brand =
    /SamsungBrowser/i.test(ua) ? "Samsung Internet"
    : /MiuiBrowser|XiaoMi/i.test(ua) ? "Mi Browser"
    : /VivoBrowser/i.test(ua) ? "Vivo Browser"
    : /HeyTapBrowser|OppoBrowser/i.test(ua) ? "Oppo Browser"
    : /UCBrowser/i.test(ua) ? "UC Browser"
    : /OPR|Opera/i.test(ua) ? "Opera"
    : /Firefox/i.test(ua) ? "Firefox"
    : /EdgA|Edg\//i.test(ua) ? "Edge"
    : /Chrome/i.test(ua) ? "Chrome"
    : "browser";
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return { device, inApp, iosSafari, brand, standalone };
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="install-step">
      <span className="install-step-n">{n}</span>
      <span>{children}</span>
    </li>
  );
}

export function InstallSheRides() {
  const [info, setInfo] = useState<ReturnType<typeof detect> | null>(null);
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [waited, setWaited] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const manualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInfo(detect());
    const queued = (window as Window & { __sheridesBIP?: BeforeInstallPromptEvent }).__sheridesBIP;
    if (queued) setPrompt(queued);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const timer = window.setTimeout(() => setWaited(true), 2500);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  async function install() {
    if (!prompt) {
      manualRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      else setNote("Install বাতিল হয়েছে। আবার চাপলে আবার জিজ্ঞেস করবে।");
    } catch {
      setNote("ফোন install-এর বক্স খুলতে পারেনি। নিচের ধাপগুলো দেখে menu থেকে install করুন।");
    }
    setPrompt(null);
  }

  async function share() {
    const data = { title: "SheRides", text: "SheRides — নারীদের জন্য নারীদের রাইড। ফোনে install করুন:", url: SHARE_URL };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
    } catch {
      return;
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setNote(`লিংকটি কপি করুন: ${SHARE_URL}`);
    }
  }

  const ready = info !== null;
  const android = info?.device === "android";
  const ios = info?.device === "ios";
  const desktop = info?.device === "desktop";
  const canPrompt = Boolean(prompt) && !installed;

  return (
    <main className="public-app install-page">
      <div className="public-panel install-panel">
        <div className="install-hero">
          <span className="public-hero-arch" aria-hidden="true" />
          <span className="public-hero-dot public-hero-dot-pink" aria-hidden="true" />
          <span className="public-hero-dot public-hero-dot-aqua" aria-hidden="true" />
          <Logo variant="lockup" tone="light" height={170} priority className="public-hero-logo" />
        </div>

        <h1 className="install-title">SheRides ফোনে install করুন</h1>
        <p className="install-sub">Install SheRides on any phone — Samsung, Xiaomi, Vivo, Oppo, Realme, Walton, iPhone. Play Store লাগবে না, জায়গাও প্রায় লাগে না।</p>
        <p className="install-note"><b>Install করার পর</b> SheRides app খুলে একবার Sign up করুন। এরপর আর কখনো sign in লাগবে না।</p>

        {!ready ? (
          <div className="skeleton h-16 rounded-full" />
        ) : info.standalone || installed ? (
          <section className="install-card install-done" role="status">
            <Icon name="check_circle" size={28} filled />
            <div>
              <p className="font-bold">SheRides install হয়ে গেছে 🎉</p>
              <p className="text-sm">হোম স্ক্রিনে SheRides আইকন খুঁজুন।</p>
            </div>
            <Link href="/" className="public-action public-violet w-full mt-2">SheRides খুলুন</Link>
          </section>
        ) : info.inApp ? (
          <section className="install-card install-warn" role="alert">
            <p className="font-bold text-base">Facebook / Messenger / WhatsApp-এর ভেতর থেকে install হয় না</p>
            {android ? (
              <>
                <p className="text-sm mt-1">নিচের বাটনে চাপুন, Chrome-এ খুলবে। তারপর <b>Install SheRides</b> চাপুন।</p>
                <a href={CHROME_INTENT} className="public-action public-mint w-full mt-3"><Icon name="open_in_new" size={20} /> Chrome-এ খুলুন</a>
                <a href={ANY_BROWSER_INTENT} className="install-link mt-2">অন্য browser-এ খুলুন</a>
              </>
            ) : (
              <ol className="install-steps mt-2">
                <Step n={1}>উপরে ডানদিকে <b>⋯</b> (তিন ডট) চাপুন</Step>
                <Step n={2}><b>Open in Safari</b> / <b>Open in browser</b> চাপুন</Step>
                <Step n={3}>Safari-তে খুললে নিচের iPhone ধাপগুলো করুন</Step>
              </ol>
            )}
            <button type="button" onClick={() => void copy()} className="public-action public-light w-full mt-3">
              <Icon name={copied ? "check" : "content_copy"} size={20} /> {copied ? "লিংক কপি হয়েছে" : "লিংক কপি করুন"}
            </button>
          </section>
        ) : (
          <>
            {(android || (desktop && canPrompt)) && (
              <button type="button" onClick={() => void install()} className="public-action public-mint install-main">
                <span className="public-action-icon public-icon-mint"><Icon name="install_mobile" size={22} /></span>
                {canPrompt ? "Install SheRides" : android && !waited ? "প্রস্তুত হচ্ছে…" : "কীভাবে install করবেন"}
              </button>
            )}

            {ios && (
              <section className="install-card">
                <p className="install-card-title"><Icon name="phone_iphone" size={20} /> iPhone-এ install</p>
                {!info.iosSafari && (
                  <p className="install-note">
                    এই পেজটি <b>Safari</b>-তে খুলুন (লিংক কপি করে Safari-তে পেস্ট করুন)। নতুন iPhone-এ Chrome-এর Share বাটন থেকেও হয়।
                  </p>
                )}
                <ol className="install-steps">
                  <Step n={1}>নিচে মাঝখানের <b>Share</b> বাটন <span className="install-key"><Icon name="ios_share" size={16} /></span> চাপুন</Step>
                  <Step n={2}>একটু নিচে স্ক্রল করে <b>Add to Home Screen</b> <span className="install-key"><Icon name="add_box" size={16} /></span> চাপুন</Step>
                  <Step n={3}>উপরে ডানদিকে <b>Add</b> চাপুন। হোম স্ক্রিনে SheRides চলে আসবে।</Step>
                </ol>
                {!info.iosSafari && (
                  <button type="button" onClick={() => void copy()} className="public-action public-light w-full mt-3">
                    <Icon name={copied ? "check" : "content_copy"} size={20} /> {copied ? "লিংক কপি হয়েছে" : "লিংক কপি করুন"}
                  </button>
                )}
              </section>
            )}

            {android && waited && !canPrompt && (
              <div ref={manualRef} className="install-card">
                <p className="install-card-title"><Icon name="android" size={20} /> Android-এ install ({info.brand})</p>
                {info.brand !== "Chrome" && info.brand !== "Samsung Internet" && info.brand !== "Edge" && (
                  <>
                    <p className="install-note">সবচেয়ে সহজ: Chrome-এ খুলে <b>Install SheRides</b> চাপুন।</p>
                    <a href={CHROME_INTENT} className="public-action public-violet w-full mb-3"><Icon name="open_in_new" size={20} /> Chrome-এ খুলুন</a>
                  </>
                )}
                <ol className="install-steps">
                  {info.brand === "Samsung Internet" ? (
                    <>
                      <Step n={1}>নিচে ডানদিকে <b>≡</b> menu চাপুন</Step>
                      <Step n={2}><b>Add page to</b> → <b>Home screen</b> চাপুন</Step>
                    </>
                  ) : (
                    <>
                      <Step n={1}>উপরে ডানদিকে <b>⋮</b> (তিন ডট) চাপুন</Step>
                      <Step n={2}><b>Install app</b> অথবা <b>Add to Home screen</b> চাপুন</Step>
                    </>
                  )}
                  <Step n={3}><b>Install</b> / <b>Add</b> চাপুন। হোম স্ক্রিনে SheRides আইকন চলে আসবে।</Step>
                </ol>
              </div>
            )}

            {desktop && (
              <section className="install-card install-qr">
                <Image src={`${brandAssetPath}/install-qr.png`} alt="QR code for sherides.online/install" width={148} height={148} />
                <div>
                  <p className="install-card-title">ফোনে install করতে স্ক্যান করুন</p>
                  <p className="install-note">ফোনের ক্যামেরা দিয়ে QR কোডটি স্ক্যান করুন, অথবা লিংকটি ফোনে পাঠান।</p>
                  <p className="install-url">sherides.online/install</p>
                </div>
              </section>
            )}
          </>
        )}

        {note && <p className="install-note mt-3" role="status">{note}</p>}

        <div className="install-share">
          <button type="button" onClick={() => void share()} className="public-action public-violet w-full">
            <span className="public-action-icon public-icon-violet"><Icon name="share" size={20} /></span>
            অন্যকে SheRides পাঠান
          </button>
          <Link href="/" className="install-link">Install না করে browser-এ চালান →</Link>
        </div>
      </div>
    </main>
  );
}

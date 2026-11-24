"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { SignupPanel } from "@/components/auth/SignupPanel";
import { ApplyForm } from "@/components/go/ApplyForm";
import { GoHub } from "@/components/go/GoHub";
import { RideDetails } from "@/components/go/RideDetails";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/auth-context";
import "./public-app.css";

export function PublicApp() {
  const params = useSearchParams();
  const { user, loading, refreshUser, signOut } = useAuth();
  // Installed app (home-screen): first open asks for sign-up once; the session then stays on this phone.
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone));
  }, []);
  const flow = params.get("flow");
  const step = params.get("step");
  const trip = params.get("trip");
  const validTrip = trip && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(trip);

  if (flow !== "partner" && flow !== "ride") {
    return (
      <main className="public-app public-app-home">
        <div className="public-entry">
          <div className="public-hero" aria-hidden="true">
            <span className="public-hero-arch" />
            <span className="public-hero-dot public-hero-dot-pink" />
            <span className="public-hero-dot public-hero-dot-aqua" />
            <Logo variant="lockup" tone="light" height={196} priority className="public-hero-logo" />
          </div>
          <h1 className="sr-only">SheRides</h1>
          <Link className="public-action public-light" href="/?flow=partner">
            <span className="public-action-icon public-icon-violet"><Icon name="two_wheeler" size={22} /></span>
            Become a Partner
          </Link>
          <Link className="public-action public-mint" href="/?flow=ride">
            <span className="public-action-icon public-icon-mint"><Icon name="location_on" size={22} /></span>
            Take a Ride
          </Link>
          <footer>
            <nav aria-label="Site information" className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-1 text-center text-sm font-semibold">
              <Link className="underline underline-offset-4" href="/about">About</Link>
              <Link className="underline underline-offset-4" href="/privacy">Privacy Policy</Link>
              <Link className="underline underline-offset-4" href="/contact">Contact</Link>
            </nav>
            <div className="bl-family" style={{ marginTop: 12, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "10px 16px", background: "#0b1226", border: "1px solid rgba(212,166,74,.6)", borderRadius: 16, padding: "12px 18px", color: "#efe3c2", fontSize: 13, lineHeight: 1.55, textAlign: "center" }}>
              <a href="https://www.brandlinkerbd.com/" style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#f6d27a", fontWeight: 700, textDecoration: "none" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/brandlinker-mark.webp" alt="BrandLinker logo" width={40} height={40} loading="lazy" decoding="async" style={{ width: 40, height: 40, borderRadius: "50%", display: "block" }} />
                <span>A BrandLinker company<small style={{ display: "block", fontWeight: 500, fontSize: 11, opacity: 0.85 }}>brandlinkerbd.com</small></span>
              </a>
              <span>Also from BrandLinker: <a href="https://cheapticketfinder.site/" style={{ color: "#f6d27a", textDecoration: "underline", textUnderlineOffset: 2 }}>Cheap Ticket Finder</a>{" · "}<a href="https://brandlinkerdubai.com/" style={{ color: "#f6d27a", textDecoration: "underline", textUnderlineOffset: 2 }}>BrandLinker Dubai</a>{" · "}<a href="https://www.brandlinkerspark.com/" style={{ color: "#f6d27a", textDecoration: "underline", textUnderlineOffset: 2 }}>BrandLinker Spark</a>{" · "}<a href="https://brandlinkerstudio.com/" style={{ color: "#f6d27a", textDecoration: "underline", textUnderlineOffset: 2 }}>BrandLinker Studio</a></span>
            </div>
          </footer>
        </div>
      </main>
    );
  }

  const hubHref = `/?flow=${flow}`;
  const approved = user?.verified || user?.role === "admin";
  const back = step || trip ? hubHref : "/";
  const returnTo = validTrip ? `${hubHref}&trip=${trip}` : hubHref;
  return (
    <main className="public-app">
      <div className={`public-panel ${approved && flow === "partner" && !step && !trip ? "public-panel-wide" : ""}`}>
        <Link className="public-back" href={back}><Icon name="arrow_back" size={18} /> Back</Link>
        {loading ? <p role="status">Loading…</p> : !user ? (
          step === "signup" || (installed && step !== "login") ? (
            <>
              {installed && (
                <p className="install-card mb-4 text-sm" role="note">
                  <b>একবার Sign up করুন।</b> এরপর এই ফোনে SheRides খুললেই সরাসরি ঢুকে যাবেন — আর কখনো sign in লাগবে না।
                </p>
              )}
              <SignupPanel flow={flow} returnTo={returnTo} />
            </>
          ) : <LoginPanel flow={flow} returnTo={returnTo} />
        ) : !approved ? (
          <section>
            <h1 className="text-2xl font-bold">Waiting for admin approval</h1>
            <p className="my-4">Once your membership is approved, you can continue here.</p>
            <button className="public-action public-mint" type="button" onClick={() => void refreshUser()}>Check approval status</button>
            <button className="public-back ml-2" type="button" onClick={() => void signOut()}>Sign out</button>
          </section>
        ) : validTrip ? <RideDetails key={trip} id={trip} /> : step === "apply" ? (
          <ApplyForm key={flow} role={flow === "partner" ? "rider" : "passenger"} />
        ) : (
          <GoHub key={`${flow}:${params.get("submitted") ?? ""}`} flow={flow} />
        )}
      </div>
    </main>
  );
}

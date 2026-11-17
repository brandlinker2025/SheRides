"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { SignupPanel } from "@/components/auth/SignupPanel";
import { ApplyForm } from "@/components/go/ApplyForm";
import { GoHub } from "@/components/go/GoHub";
import { RideDetails } from "@/components/go/RideDetails";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { InsurancePanel } from "./InsurancePanel";
import { useAuth } from "@/lib/auth-context";
import "./public-app.css";

export function PublicApp() {
  const params = useSearchParams();
  const { user, loading, refreshUser, signOut } = useAuth();
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
        </div>
      </main>
    );
  }

  const hubHref = `/?flow=${flow}`;
  const approved = user?.verified || user?.role === "admin";
  const back = step || trip ? hubHref : "/";
  const passengerOptions = flow === "ride" && !step && !trip;
  const returnTo = validTrip ? `${hubHref}&trip=${trip}` : hubHref;
  return (
    <main className="public-app">
      <div className={`public-panel ${approved && !step ? "public-panel-wide" : ""}`}>
        <Link className="public-back" href={back}><Icon name="arrow_back" size={18} /> Back</Link>
        {passengerOptions && (
          <div className="public-tools">
            <InsurancePanel />
            <details>
              <summary><span className="public-tile-icon public-tile-peach"><Icon name="sell" size={20} /></span>Promotions</summary>
              <p>Use a promo code in the ride form to see the discount before booking.</p>
            </details>
          </div>
        )}
        {loading ? <p role="status">Loading…</p> : !user ? (
          passengerOptions ? (
            <Link className="public-action public-mint w-full" href="/?flow=ride&step=login">
              <Icon name="location_on" size={20} /> Live Ride
            </Link>
          ) : step === "signup" ? (
            <SignupPanel flow={flow} returnTo={returnTo} />
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

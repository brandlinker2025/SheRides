"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { BookRide } from "@/components/go/BookRide";
import { RiderMode } from "@/components/go/RiderMode";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import {
  KIND_LABEL,
  RIDE_STATUS_LABEL,
  formatTaka,
  formatWhen,
  goErrorMessage,
  type GoApplication,
  type GoRide,
  type GoRole,
} from "@/lib/go";
import { createClient } from "@/lib/supabase/client";

type Tab = "book" | "rides" | "rider";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600",
  approved: "bg-green-600/15 text-green-600",
  rejected: "bg-red-500/15 text-red-500",
  suspended: "bg-red-500/15 text-red-500",
};

function ApplyCard({ role, app }: { role: GoRole; app: GoApplication | undefined }) {
  const rider = role === "rider";
  const status = app?.status;
  return (
    <div className="card-surface p-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff4d8d] to-[#9c27b0] text-white flex items-center justify-center">
          <Icon name={rider ? "sports_motorsports" : "hail"} filled />
        </span>
        <div className="flex-1">
          <h3 className="font-headline-md text-[20px] font-bold">{rider ? "Become a rider" : "Book rides"}</h3>
          <p className="font-body-sm text-secondary">{rider ? "Earn by giving rides to women" : "Safe rides with women riders"}</p>
        </div>
        {status && <span className={`px-3 py-1 rounded-full font-label-lg text-xs capitalize ${STATUS_STYLE[status]}`}>{status}</span>}
      </div>
      {status === "pending" && <p className="font-body-sm text-secondary">An admin is checking your documents. You will get a notification.</p>}
      {(status === "rejected" || status === "suspended") && app?.admin_notes && (
        <p className="font-body-sm text-error">Admin note: {app.admin_notes}</p>
      )}
      {(!status || status === "rejected") && (
        <Link href={`/go/apply?role=${role}`} className="h-12 rounded-full bg-accent-magenta text-white font-label-lg inline-flex items-center justify-center gap-2">
          <Icon name="verified_user" size={20} />
          {status === "rejected" ? "Fix and resubmit" : rider ? "Apply as rider" : "Get verified"}
        </Link>
      )}
    </div>
  );
}

function MyRides() {
  const { user } = useAuth();
  const [rides, setRides] = useState<GoRide[] | null>(null);
  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user) return;
    void supabase
      .from("go_rides")
      .select("*")
      .or(`passenger_id.eq.${user.id},rider_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(40)
      .then(({ data }) => setRides((data ?? []) as GoRide[]));
  }, [user]);

  if (!rides) return <div className="skeleton h-40" />;
  if (!rides.length) return <p className="card-surface p-8 text-center font-body-sm text-secondary">No rides yet.</p>;
  return (
    <div className="flex flex-col gap-3">
      {rides.map((ride) => (
        <Link key={ride.id} href={`/go/ride/${ride.id}`} className="card-surface card-hover p-4 flex items-center gap-4">
          <span className="w-11 h-11 rounded-full bg-accent-magenta/10 text-accent-magenta flex items-center justify-center shrink-0">
            <Icon name={ride.passenger_id === user?.id ? "hail" : "sports_motorsports"} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-label-lg truncate">{ride.drop_text ?? ride.pickup_text}</p>
            <p className="font-body-sm text-tertiary">
              {KIND_LABEL[ride.kind]} · {ride.kind === "now" ? new Date(ride.created_at).toLocaleDateString("en-BD") : formatWhen(ride.scheduled_at)} · {RIDE_STATUS_LABEL[ride.status]}
            </p>
          </div>
          <p className="font-label-lg">{formatTaka(ride.fare)}</p>
        </Link>
      ))}
    </div>
  );
}

function GoHub() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [apps, setApps] = useState<GoApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<GoRide | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase || !user) return;
    const { data, error: loadError } = await supabase
      .from("go_applications")
      .select("id, user_id, role, status, admin_notes, created_at")
      .eq("user_id", user.id);
    if (loadError) {
      setError(goErrorMessage(loadError));
      setApps([]);
      return;
    }
    setApps((data ?? []) as GoApplication[]);
    const { data: current } = await supabase
      .from("go_rides")
      .select("*")
      .eq("passenger_id", user.id)
      .eq("kind", "now")
      .in("status", ["requested", "accepted", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setActive((current as GoRide | null) ?? null);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const passenger = apps?.find((a) => a.role === "passenger");
  const rider = apps?.find((a) => a.role === "rider");
  const canBook = passenger?.status === "approved";
  const canRide = rider?.status === "approved";
  const requested = params.get("tab") as Tab | null;
  const tab: Tab = requested === "rider" && canRide ? "rider" : requested === "rides" ? "rides" : canBook ? "book" : canRide ? "rider" : "book";
  const submitted = params.get("submitted");

  const tabs: { id: Tab; label: string; icon: string; show: boolean }[] = [
    { id: "book", label: "Book", icon: "hail", show: true },
    { id: "rides", label: "My rides", icon: "history", show: Boolean(canBook || canRide) },
    { id: "rider", label: "Rider mode", icon: "sports_motorsports", show: canRide },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-container-margin-mobile lg:px-0 py-10 flex flex-col gap-6">
      <header className="rounded-[24px] p-6 sm:p-8 text-white bg-gradient-to-br from-[#4a1530] via-[#a3195b] to-[#c45c2a] shadow-xl relative overflow-hidden">
        <Icon name="two_wheeler" className="absolute -right-4 -bottom-6 text-[160px] opacity-10" />
        <p className="font-label-caps text-label-caps opacity-80">RIDE BOOKING · WOMEN ONLY · VERIFIED</p>
        <h1 className="font-display-lg text-[36px] sm:text-[44px] leading-tight font-bold mt-1">SheRides</h1>
        <p className="font-body-md opacity-90 max-w-md mt-1">
          Rides by women, for women. Every rider and passenger is checked by an admin. Ride now, pre-book, or hire for hours.
        </p>
      </header>

      {submitted && (
        <p className="card-surface p-4 font-body-sm flex items-center gap-2">
          <Icon name="task_alt" className="text-green-600" /> Application sent. You will get a notification once an admin approves it.
        </p>
      )}
      {error && <p className="card-surface p-4 font-body-sm text-error">{error}</p>}
      {apps === null && <div className="skeleton h-40" />}

      {active && tab === "book" && (
        <Link href={`/go/ride/${active.id}`} className="card-surface card-hover p-5 flex items-center gap-4 border-2 border-accent-magenta">
          <span className="w-3 h-3 rounded-full bg-accent-magenta animate-pulse" />
          <div className="flex-1">
            <p className="font-label-lg">Your ride: {RIDE_STATUS_LABEL[active.status]}</p>
            <p className="font-body-sm text-tertiary truncate">{active.pickup_text}</p>
          </div>
          <Icon name="chevron_right" />
        </Link>
      )}

      {apps && (canBook || canRide) && (
        <nav className="flex gap-2 overflow-x-auto hide-scrollbar">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => router.replace(`/go?tab=${t.id}`)}
                className={`nav-pill !py-2 !px-4 ${tab === t.id ? "nav-pill-active" : "!bg-surface-container-lowest !text-on-surface !border-surface-border"}`}
              >
                <Icon name={t.icon} size={20} filled={tab === t.id} /> {t.label}
              </button>
            ))}
        </nav>
      )}

      {apps && tab === "book" && (canBook ? <BookRide /> : null)}
      {apps && tab === "rides" && <MyRides />}
      {apps && tab === "rider" && canRide && <RiderMode />}

      {apps && (!canBook || !canRide) && tab !== "rider" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {!canBook && <ApplyCard role="passenger" app={passenger} />}
          {!canRide && <ApplyCard role="rider" app={rider} />}
        </div>
      )}

      <section className="card-surface p-6">
        <h2 className="font-headline-md text-[18px] font-bold mb-3 flex items-center gap-2">
          <Icon name="shield_person" className="text-accent-magenta" /> How we keep it women-only
        </h2>
        <ul className="font-body-sm text-secondary flex flex-col gap-2">
          <li>• Every passenger and rider shows NID + a live selfie; an admin checks each one by hand.</li>
          <li>• Your ride starts only when you tell the rider your secret 4-digit PIN.</li>
          <li>• Share your live trip with family, and SOS is one tap away during the ride.</li>
          <li>• Phone numbers stay hidden. Low ratings go straight to the admin team.</li>
        </ul>
      </section>
    </div>
  );
}

export default function GoPage() {
  return (
    <Suspense fallback={null}>
      <GoHub />
    </Suspense>
  );
}

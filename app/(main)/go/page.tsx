"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { RideDeck } from "@/components/go/BookRide";
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
        <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b7cf8] to-[#14b8c4] text-white flex items-center justify-center">
          <Icon name={rider ? "sports_motorsports" : "hail"} filled />
        </span>
        <div className="flex-1">
          <h3 className="font-headline-md text-[20px] font-bold">{rider ? "Become a rider" : "Book rides"}</h3>
          <p className="font-body-sm text-secondary">{rider ? "Earn by giving rides to women" : "Safe rides with women riders"}</p>
        </div>
        {status && <span className={`px-3 py-1 rounded-full font-label-lg text-xs capitalize ${STATUS_STYLE[status]}`}>{status}</span>}
      </div>
      {status === "pending" && (
        <div className="rounded-2xl border border-[#ffb95f]/25 bg-[#1a1a24] p-4 text-[#e4e1e9]">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffb95f]">Identity and safety verification</p>
          <p className="mt-1 text-base font-bold">An admin is checking your documents.</p>
          <p className="mt-2 text-sm text-white/70">
            Your National ID and live selfie are with the admin. This card does not show a biometric score, a government match, or a document number.
          </p>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-white/70">
            <li>Smart NID — under review</li>
            <li>Live selfie — submitted, not marked verified</li>
          </ul>
          <p className="mt-3 text-xs text-white/45">Usually approved within 15–30 minutes. You will get a notification.</p>
        </div>
      )}
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
  const tab: Tab = requested === "rides" ? "rides" : requested === "rider" ? "rider" : "book";
  const submitted = params.get("submitted");

  const notices = (
    <>
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
          <div className="flex-1 min-w-0">
            <p className="font-label-lg">Your ride: {RIDE_STATUS_LABEL[active.status]}</p>
            <p className="font-body-sm text-tertiary truncate">{active.pickup_text}</p>
          </div>
          <Icon name="chevron_right" />
        </Link>
      )}
    </>
  );

  if (tab === "rides") {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-bold">My Rides</h1>
        {notices}
        {apps && <MyRides />}
      </div>
    );
  }

  if (tab === "rider") {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-bold">Rider Mode</h1>
        {notices}
        {apps && canRide && <RiderMode />}
        {apps && !canRide && <ApplyCard role="rider" app={rider} />}
      </div>
    );
  }

  return (
    <RideDeck
      showForm={Boolean(apps && canBook)}
      below={
        apps && (!canBook || !canRide) ? (
          <div className="grid gap-4">
            {!canBook && <ApplyCard role="passenger" app={passenger} />}
            {!canRide && <ApplyCard role="rider" app={rider} />}
          </div>
        ) : null
      }
    >
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b7cf8] to-[#14b8c4] text-white">
          <Icon name="two_wheeler" filled />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffb95f]">Sanctuary</p>
          <h1 className="text-2xl font-bold leading-tight text-[#e4e1e9]">Book A Ride</h1>
          <p className="text-sm text-white/70">Women riders only · an admin checks every captain</p>
          <Link href="/partner" className="mt-1 inline-flex text-sm font-semibold text-[#ddb7ff]">
            Become a ride partner
          </Link>
        </div>
      </header>
      {notices}
    </RideDeck>
  );
}

export default function GoPage() {
  return (
    <Suspense fallback={null}>
      <GoHub />
    </Suspense>
  );
}

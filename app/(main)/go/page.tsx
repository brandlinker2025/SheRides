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
        <div className="rounded-2xl border border-[#ffb95f]/40 bg-[#1a1a24] p-4 text-[#e4e1e9]" role="status">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffb95f]">{rider ? "CAPTAIN REVIEW" : "BOOKING REVIEW"}</p>
          <p className="mt-1 text-base font-bold">{rider ? "An admin is reviewing your captain application" : "An admin needs to approve booking"}</p>
          <p className="mt-2 text-sm text-white/70">
            {rider
              ? "You cannot go online or receive rides until this is approved. You will get a notification when it is decided."
              : "Booking stays closed until an admin approves you. You will get a notification when you can book."}
          </p>
        </div>
      )}
      {(status === "rejected" || status === "suspended") && app?.admin_notes && (
        <p className="font-body-sm text-error">Admin note: {app.admin_notes}</p>
      )}
      {(!status || status === "rejected") && (
        <Link href={`/go/apply?role=${role}`} className="btn btn-primary">
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
  const [ridesError, setRidesError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const reload = useCallback(() => {
    const supabase = createClient();
    if (!user) return;
    if (!supabase) {
      setRidesError("Ride history is not connected yet.");
      setRides([]);
      return;
    }
    void supabase
      .from("go_rides")
      .select("*")
      .or(`passenger_id.eq.${user.id},rider_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(40)
      .then(({ data, error }) => {
        if (error) {
          setRidesError(goErrorMessage(error));
          setRides([]);
          return;
        }
        setRides((data ?? []) as GoRide[]);
      });
  }, [user]);
  useEffect(() => {
    reload();
  }, [reload]);

  async function cancelRide(id: string) {
    const supabase = createClient();
    if (!supabase) return;
    setCancelError(null);
    const { error } = await supabase.rpc("go_cancel_ride", { p_ride_id: id, p_reason: "Passenger cancelled the pre-book" });
    if (error) {
      setCancelError(goErrorMessage(error));
      return;
    }
    reload();
  }

  if (ridesError) return <p className="card-surface p-6 font-body-sm text-error" role="alert">{ridesError}</p>;
  if (!rides) return <div className="skeleton h-40" />;
  if (!rides.length) return <p className="card-surface p-8 text-center font-body-sm text-secondary">No rides yet.</p>;
  const upcoming = rides.filter((ride) => ride.kind === "scheduled" && (ride.status === "requested" || ride.status === "accepted") && ride.passenger_id === user?.id);
  const rest = rides.filter((ride) => !upcoming.some((item) => item.id === ride.id));
  return (
    <div className="flex flex-col gap-3">
      {cancelError && <p className="card-surface p-4 text-sm text-error" role="alert">{cancelError}</p>}
      {upcoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[#FFB804]">Upcoming pre-booked rides</h2>
          {upcoming.map((ride) => (
            <article key={ride.id} className="card-surface flex flex-col gap-3 p-4">
              <Link href={`/go/ride/${ride.id}`} className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF6772]/15 text-[#FF6772]">
                  <Icon name="event" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-label-lg truncate">{ride.drop_text ?? ride.pickup_text}</p>
                  <p className="font-body-sm text-tertiary">{formatWhen(ride.scheduled_at)} · {RIDE_STATUS_LABEL[ride.status]}</p>
                </div>
                <p className="font-label-lg">{formatTaka(ride.fare)}</p>
              </Link>
              <button type="button" onClick={() => void cancelRide(ride.id)} className="btn btn-danger h-10 min-h-10 self-start px-4 text-sm">
                Cancel pre-book
              </button>
            </article>
          ))}
        </section>
      )}
      {rest.map((ride) => (
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
  const requested = params.get("tab");
  const role = params.get("role");
  const tab: Tab = requested === "rides" || requested === "rider" ? requested : role === "rider" ? "rider" : "book";
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

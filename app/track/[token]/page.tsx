"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PandaStandaloneFrame } from "@/components/brand/PandaStandaloneFrame";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { RIDE_STATUS_LABEL, mapsLink, type GoRideStatus } from "@/lib/go";
import { createClient } from "@/lib/supabase/client";

type Trip = {
  status: GoRideStatus;
  pickup_text: string;
  drop_text: string | null;
  rider_first_name: string | null;
  bike_plate: string | null;
  rider_lat: number | null;
  rider_lng: number | null;
  rider_seen_at: string | null;
  started_at: string | null;
  completed_at: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function TrackTripPage() {
  const { token } = useParams<{ token: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    if (!token || !UUID.test(token)) {
      setState("missing");
      return;
    }
    const load = async () => {
      const supabase = createClient();
      if (!supabase) return;
      const { data } = await supabase.rpc("go_shared_trip", { p_token: token });
      const row = ((data ?? []) as Trip[])[0];
      if (!row) {
        setState("missing");
        return;
      }
      setTrip(row);
      setState("ok");
    };
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [token]);

  return (
    <PandaStandaloneFrame>
      <section className="bg-surface-container-lowest rounded-[24px] shadow-premium p-6 sm:p-8 flex flex-col gap-5 max-w-lg mx-auto">
        <BrandLogo className="text-[38px]" />
        {state === "loading" && <div className="skeleton h-40" />}
        {state === "missing" && (
          <p className="font-body-md text-secondary">This trip link has expired or is not valid. Trip links stop working 2 hours after the ride ends.</p>
        )}
        {state === "ok" && trip && (
          <>
            <div>
              <p className="font-label-caps text-label-caps text-accent-magenta">LIVE TRIP · SHERIDES</p>
              <h1 className="font-headline-xl text-[28px] font-bold flex items-center gap-2">
                {trip.status !== "completed" && trip.status !== "cancelled" && <span className="w-3 h-3 rounded-full bg-accent-magenta animate-pulse" />}
                {RIDE_STATUS_LABEL[trip.status]}
              </h1>
            </div>
            <div className="font-body-sm flex flex-col gap-2">
              <p className="flex gap-2"><Icon name="trip_origin" className="text-green-600" />{trip.pickup_text}</p>
              {trip.drop_text && <p className="flex gap-2"><Icon name="flag" className="text-accent-magenta" />{trip.drop_text}</p>}
              {trip.rider_first_name && (
                <p className="flex gap-2"><Icon name="sports_motorsports" className="text-accent-magenta" />Rider {trip.rider_first_name}{trip.bike_plate ? ` · ${trip.bike_plate}` : ""}</p>
              )}
            </div>
            {trip.rider_lat != null && trip.rider_lng != null && trip.status !== "completed" ? (
              <a href={mapsLink(trip.rider_lat, trip.rider_lng)} target="_blank" rel="noreferrer" className="h-12 rounded-full bg-accent-magenta text-white font-label-lg inline-flex items-center justify-center gap-2">
                <Icon name="near_me" /> Open live location on map
              </a>
            ) : null}
            {trip.rider_seen_at && trip.status !== "completed" && (
              <p className="font-body-sm text-tertiary">
                Last updated {new Date(trip.rider_seen_at).toLocaleTimeString("en-BD", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit" })}. This page refreshes every 15 seconds.
              </p>
            )}
            {trip.status === "completed" && <p className="font-body-md text-green-700 flex gap-2"><Icon name="task_alt" /> She reached safely.</p>}
          </>
        )}
      </section>
    </PandaStandaloneFrame>
  );
}

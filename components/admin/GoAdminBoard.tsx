"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminCancelGoRide, reviewGoApplication } from "@/app/admin/go/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { KIND_LABEL, RIDE_STATUS_LABEL, formatTaka, formatWhen, type GoRideKind, type GoRideStatus } from "@/lib/go";

export type AdminGoApplication = {
  id: string;
  role: "passenger" | "rider";
  status: "pending" | "approved" | "rejected" | "suspended";
  full_name: string;
  nid_number: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  license_number: string | null;
  bike_model: string | null;
  bike_plate: string | null;
  admin_notes: string | null;
  created_at: string;
  profile: { full_name: string; username: string; avatar_url: string | null } | null;
  docs: { label: string; url: string }[];
};

export type AdminGoRide = {
  id: string;
  kind: GoRideKind;
  status: GoRideStatus;
  pickup_text: string;
  drop_text: string | null;
  fare: number;
  scheduled_at: string | null;
  created_at: string;
  rider_rating: number | null;
  rider_feedback: string | null;
  passenger_rating: number | null;
  passenger_feedback: string | null;
  passenger: { full_name: string } | null;
  rider: { full_name: string } | null;
};

type Filter = "pending" | "approved" | "rejected" | "suspended" | "rides";

const CHIP: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700",
  approved: "bg-green-600/15 text-green-700",
  rejected: "bg-red-500/15 text-red-600",
  suspended: "bg-red-500/15 text-red-600",
};

function maskNid(value: string) {
  return value.length <= 4 ? value : `${"•".repeat(value.length - 4)}${value.slice(-4)}`;
}

function ApplicationCard({ app }: { app: AdminGoApplication }) {
  const router = useRouter();
  const [notes, setNotes] = useState(app.admin_notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNid, setShowNid] = useState(false);

  async function act(status: string) {
    if ((status === "rejected" || status === "suspended") && !notes.trim()) {
      setError("Write a short reason so she knows what to fix.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await reviewGoApplication(app.id, status, notes);
    setBusy(false);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  const selfie = app.docs.find((d) => d.label === "Live selfie");
  const nidFront = app.docs.find((d) => d.label === "NID front");

  return (
    <article className="card-surface p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="avatar-ring w-12 h-12 rounded-full overflow-hidden shrink-0">
          <Avatar src={app.profile?.avatar_url} alt={app.full_name} size={48} className="w-full h-full" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-label-lg truncate">{app.full_name}</p>
          <p className="font-body-sm text-tertiary truncate">
            Profile: {app.profile?.full_name ?? "—"} · {new Date(app.created_at).toLocaleDateString("en-BD")}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-label-lg capitalize bg-accent-magenta/10 text-accent-magenta">{app.role}</span>
        <span className={`px-3 py-1 rounded-full text-xs font-label-lg capitalize ${CHIP[app.status]}`}>{app.status}</span>
      </div>

      {/* Face check side by side: selfie vs NID photo */}
      {(selfie || nidFront) && (
        <div className="grid grid-cols-2 gap-3">
          {[selfie, nidFront].map((doc) =>
            doc ? (
              <a key={doc.label} href={doc.url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-surface-border bg-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={doc.url} alt={doc.label} className="w-full h-44 object-cover" />
                <p className="font-label-caps text-[10px] p-2 text-tertiary">{doc.label.toUpperCase()} · TAP TO ENLARGE</p>
              </a>
            ) : null
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-body-sm">
        <button type="button" onClick={() => setShowNid((v) => !v)} className="rounded-lg bg-soft-off-white p-3 text-left">
          <p className="font-label-caps text-[10px] text-tertiary">NID (tap to {showNid ? "hide" : "show"})</p>
          <p className="break-all">{showNid ? app.nid_number : maskNid(app.nid_number)}</p>
        </button>
        <div className="rounded-lg bg-soft-off-white p-3">
          <p className="font-label-caps text-[10px] text-tertiary">Emergency contact</p>
          <p>{app.emergency_contact_name ?? "—"}</p>
          {app.emergency_contact_phone && <a href={`tel:${app.emergency_contact_phone}`} className="text-accent-magenta">{app.emergency_contact_phone}</a>}
        </div>
        {app.role === "rider" && (
          <>
            <div className="rounded-lg bg-soft-off-white p-3">
              <p className="font-label-caps text-[10px] text-tertiary">Licence</p>
              <p className="break-all">{app.license_number ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-soft-off-white p-3 col-span-2 sm:col-span-3">
              <p className="font-label-caps text-[10px] text-tertiary">Bike</p>
              <p>{app.bike_model ?? "—"} · <span className="font-bold">{app.bike_plate ?? "—"}</span></p>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {app.docs
          .filter((d) => d.label !== "Live selfie" && d.label !== "NID front")
          .map((doc) => (
            <a key={doc.label} href={doc.url} target="_blank" rel="noreferrer" className="h-10 px-4 inline-flex items-center gap-1.5 rounded-full border border-surface-border font-label-lg text-sm text-accent-magenta">
              <Icon name="description" size={18} /> {doc.label}
            </a>
          ))}
      </div>

      <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Note to applicant (required to reject/suspend)" className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 font-body-sm" />
      {error && <p className="font-body-sm text-error">{error}</p>}
      <div className="flex flex-wrap gap-2 justify-end">
        {app.status !== "approved" && (
          <button type="button" disabled={busy} onClick={() => void act("approved")} className="h-11 px-5 rounded-lg bg-accent-magenta text-white font-label-lg">
            Approve
          </button>
        )}
        {app.status === "pending" && (
          <button type="button" disabled={busy} onClick={() => void act("rejected")} className="h-11 px-4 rounded-lg border border-error text-error font-label-lg">
            Reject
          </button>
        )}
        {app.status === "approved" && (
          <button type="button" disabled={busy} onClick={() => void act("suspended")} className="h-11 px-4 rounded-lg border border-error text-error font-label-lg">
            Suspend
          </button>
        )}
      </div>
    </article>
  );
}

export function GoAdminBoard({ applications, rides }: { applications: AdminGoApplication[]; rides: AdminGoRide[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("pending");
  const counts = {
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    suspended: applications.filter((a) => a.status === "suspended").length,
  };
  const liveRides = rides.filter((r) => r.status === "requested" || r.status === "accepted" || r.status === "in_progress").length;
  const shown = applications.filter((a) => a.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Waiting review", value: counts.pending, icon: "hourglass_top" },
          { label: "Approved riders", value: applications.filter((a) => a.role === "rider" && a.status === "approved").length, icon: "sports_motorsports" },
          { label: "Approved passengers", value: applications.filter((a) => a.role === "passenger" && a.status === "approved").length, icon: "hail" },
          { label: "Live rides", value: liveRides, icon: "two_wheeler" },
        ].map((s) => (
          <div key={s.label} className="card-surface p-4">
            <Icon name={s.icon} className="text-accent-magenta" />
            <p className="font-display-lg text-[30px] font-bold">{s.value}</p>
            <p className="font-label-caps text-[10px] text-tertiary">{s.label.toUpperCase()}</p>
          </div>
        ))}
      </div>

      <nav className="flex gap-2 overflow-x-auto hide-scrollbar">
        {(["pending", "approved", "rejected", "suspended", "rides"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`h-10 px-4 rounded-full font-label-lg text-sm capitalize whitespace-nowrap border ${
              filter === f ? "bg-accent-magenta text-white border-accent-magenta" : "border-surface-border bg-surface-container-lowest"
            }`}
          >
            {f === "rides" ? `Rides (${rides.length})` : `${f} (${counts[f]})`}
          </button>
        ))}
      </nav>

      {filter !== "rides" ? (
        shown.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {shown.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <p className="card-surface p-8 text-center font-body-sm text-secondary">Nothing here.</p>
        )
      ) : (
        <div className="flex flex-col gap-3">
          {rides.map((ride) => {
            const low = (ride.rider_rating ?? 5) <= 2 || (ride.passenger_rating ?? 5) <= 2;
            return (
              <article key={ride.id} className={`card-surface p-4 flex flex-col gap-2 ${low ? "border-2 border-error" : ""}`}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-label-lg">{ride.passenger?.full_name ?? "Passenger"}</span>
                  <Icon name="arrow_forward" size={16} className="text-tertiary" />
                  <span className="font-label-lg">{ride.rider?.full_name ?? "No rider yet"}</span>
                  <span className="ml-auto font-label-lg">{formatTaka(ride.fare)}</span>
                </div>
                <p className="font-body-sm text-tertiary">
                  {KIND_LABEL[ride.kind]} · {ride.kind === "now" ? new Date(ride.created_at).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" }) : formatWhen(ride.scheduled_at)} · {RIDE_STATUS_LABEL[ride.status]}
                </p>
                <p className="font-body-sm">{ride.pickup_text}{ride.drop_text ? ` → ${ride.drop_text}` : ""}</p>
                {(ride.rider_rating || ride.passenger_rating) && (
                  <p className="font-body-sm">
                    {ride.rider_rating ? `Rider ★${ride.rider_rating}${ride.rider_feedback ? ` “${ride.rider_feedback}”` : ""}` : ""}
                    {ride.passenger_rating ? ` · Passenger ★${ride.passenger_rating}${ride.passenger_feedback ? ` “${ride.passenger_feedback}”` : ""}` : ""}
                  </p>
                )}
                {(ride.status === "requested" || ride.status === "accepted") && (
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await adminCancelGoRide(ride.id);
                      if (!result.error) router.refresh();
                    }}
                    className="self-end h-9 px-4 rounded-lg border border-error text-error font-label-lg text-sm"
                  >
                    Cancel ride
                  </button>
                )}
              </article>
            );
          })}
          {!rides.length && <p className="card-surface p-8 text-center font-body-sm text-secondary">No rides yet.</p>}
        </div>
      )}
    </div>
  );
}

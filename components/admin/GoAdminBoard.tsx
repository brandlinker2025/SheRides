"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminCancelGoRide, reviewGoApplication } from "@/app/admin/go/actions";
import { Icon } from "@/components/ui/Icon";
import { KIND_LABEL, RIDE_STATUS_LABEL, formatTaka, type GoRideKind, type GoRideStatus } from "@/lib/go";

export type AdminGoApplication = {
  id: string;
  user_id: string;
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
  rider_id: string | null;
  completed_at: string | null;
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

type Filter = "pending" | "approved" | "rejected" | "suspended";
type Role = "rider" | "passenger";

const CHIP: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700",
  approved: "bg-green-600/15 text-green-700",
  rejected: "bg-red-500/15 text-red-600",
  suspended: "bg-red-500/15 text-red-600",
};

function maskNid(value: string) {
  return value.length <= 4 ? value : `${"•".repeat(value.length - 4)}${value.slice(-4)}`;
}

/** Ride history for one rider, built from the rides the admin page already loaded. */
function RiderHistory({ rides }: { rides: AdminGoRide[] }) {
  const [open, setOpen] = useState(false);
  const done = rides.filter((r) => r.status === "completed");
  const cancelled = rides.filter((r) => r.status === "cancelled").length;
  const rated = done.filter((r) => r.rider_rating != null);
  const average = rated.length ? rated.reduce((sum, r) => sum + (r.rider_rating ?? 0), 0) / rated.length : null;
  const earned = done.reduce((sum, r) => sum + r.fare, 0);

  return (
    <div className="rounded-xl border border-surface-border p-3">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full flex items-center gap-3 text-left">
        <Icon name="history" className="text-accent-magenta" />
        <span className="flex-1 font-body-sm">
          <span className="font-label-lg">{done.length} completed</span> · {cancelled} cancelled · {formatTaka(earned)}
          {average != null ? ` · ★${average.toFixed(1)}` : ""}
        </span>
        <Icon name={open ? "expand_less" : "expand_more"} />
      </button>
      {open &&
        (rides.length ? (
          <ul className="mt-3 flex flex-col gap-2">
            {rides.slice(0, 15).map((ride) => (
              <li key={ride.id} className="font-body-sm border-t border-surface-border pt-2">
                <p className="flex justify-between gap-3">
                  <span className="truncate">{ride.pickup_text}{ride.drop_text ? ` → ${ride.drop_text}` : ""}</span>
                  <span className="shrink-0 font-label-lg">{formatTaka(ride.fare)}</span>
                </p>
                <p className="text-tertiary">
                  {new Date(ride.created_at).toLocaleDateString("en-BD", { timeZone: "Asia/Dhaka" })} · {RIDE_STATUS_LABEL[ride.status]} · {ride.passenger?.full_name ?? "Passenger"}
                  {ride.rider_rating ? ` · ★${ride.rider_rating}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 font-body-sm text-tertiary">No rides in the latest 300 platform rides.</p>
        ))}
    </div>
  );
}

function DocThumb({ doc }: { doc: { label: string; url: string } | undefined }) {
  if (!doc) return <span className="text-xs text-tertiary">Missing</span>;
  return (
    <a href={doc.url} target="_blank" rel="noreferrer" className="block w-16">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={doc.url} alt={doc.label} className="h-16 w-16 rounded-lg object-cover border border-surface-border bg-black/5" />
      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-tertiary">{doc.label}</span>
    </a>
  );
}

function VerificationRow({ app, rides }: { app: AdminGoApplication; rides: AdminGoRide[] }) {
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
  const extraDocs = app.docs.filter((doc) => doc.label !== "Live selfie" && doc.label !== "NID front");

  return (
    <tr className="border-t border-surface-border align-top">
      <td className="p-3">
        <div className="flex gap-2">
          <DocThumb doc={selfie} />
          <DocThumb doc={nidFront} />
        </div>
      </td>
      <td className="p-3 min-w-[160px]">
        <p className="font-label-lg">{app.full_name}</p>
        <p className="font-body-sm text-tertiary">{app.profile?.full_name ?? "No profile name"}</p>
        <p className="font-body-sm text-tertiary">{new Date(app.created_at).toLocaleDateString("en-BD")}</p>
      </td>
      <td className="p-3">
        <button type="button" onClick={() => setShowNid((value) => !value)} className="text-left">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-tertiary">NID · tap to {showNid ? "hide" : "show"}</span>
          <span className="font-body-sm break-all">{showNid ? app.nid_number : maskNid(app.nid_number)}</span>
        </button>
        {app.role === "rider" && (
          <p className="mt-2 font-body-sm text-secondary">
            {app.bike_model ?? "Bike not given"} · {app.bike_plate ?? "no plate"}
          </p>
        )}
      </td>
      <td className="p-3">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${CHIP[app.status]}`}>{app.status}</span>
        <div className="mt-2 flex flex-col gap-1">
          {extraDocs.map((doc) => (
            <a key={doc.label} href={doc.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-accent-magenta">
              {doc.label}
            </a>
          ))}
        </div>
      </td>
      <td className="p-3 min-w-[220px]">
        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={500}
          placeholder="Note (required to reject)"
          className="mb-2 w-full rounded-lg border border-surface-border bg-soft-off-white px-3 py-2 text-sm"
        />
        {error && <p className="mb-2 text-sm text-error">{error}</p>}
        <div className="flex flex-wrap gap-2">
          {app.status !== "approved" && (
            <button type="button" disabled={busy} onClick={() => void act("approved")} className="h-9 rounded-lg bg-accent-magenta px-3 text-sm font-semibold text-white">
              Approve
            </button>
          )}
          {app.status === "pending" && (
            <button type="button" disabled={busy} onClick={() => void act("rejected")} className="h-9 rounded-lg border border-error px-3 text-sm font-semibold text-error">
              Reject
            </button>
          )}
          {app.status === "approved" && (
            <button type="button" disabled={busy} onClick={() => void act("suspended")} className="h-9 rounded-lg border border-error px-3 text-sm font-semibold text-error">
              Suspend
            </button>
          )}
        </div>
        {app.role === "rider" && app.status !== "pending" && (
          <div className="mt-3">
            <RiderHistory rides={rides} />
          </div>
        )}
      </td>
    </tr>
  );
}

export function GoAdminBoard({ applications, rides }: { applications: AdminGoApplication[]; rides: AdminGoRide[] }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>("rider");
  const [filter, setFilter] = useState<Filter>("pending");
  const [query, setQuery] = useState("");
  const riders = applications.filter((a) => a.role === "rider");
  const passengers = applications.filter((a) => a.role === "passenger");
  const scoped = role === "rider" ? riders : passengers;
  const counts = {
    pending: scoped.filter((a) => a.status === "pending").length,
    approved: scoped.filter((a) => a.status === "approved").length,
    rejected: scoped.filter((a) => a.status === "rejected").length,
    suspended: scoped.filter((a) => a.status === "suspended").length,
  };
  const liveRides = rides.filter((r) => r.status === "requested" || r.status === "accepted" || r.status === "in_progress").length;
  const q = query.trim().toLowerCase();
  const shown = scoped.filter(
    (a) =>
      a.status === filter &&
      (!q || [a.full_name, a.profile?.full_name, a.bike_plate, a.bike_model, a.license_number].some((v) => v?.toLowerCase().includes(q)))
  );
  const ridesByRider = new Map<string, AdminGoRide[]>();
  for (const ride of rides) {
    if (!ride.rider_id) continue;
    const list = ridesByRider.get(ride.rider_id) ?? [];
    list.push(ride);
    ridesByRider.set(ride.rider_id, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Riders waiting", value: riders.filter((a) => a.status === "pending").length, icon: "hourglass_top" },
          { label: "Approved riders", value: riders.filter((a) => a.status === "approved").length, icon: "sports_motorsports" },
          { label: "Suspended riders", value: riders.filter((a) => a.status === "suspended").length, icon: "block" },
          { label: "Live rides", value: liveRides, icon: "two_wheeler" },
        ].map((s) => (
          <div key={s.label} className="card-surface p-4">
            <Icon name={s.icon} className="text-accent-magenta" />
            <p className="font-display-lg text-[30px] font-bold">{s.value}</p>
            <p className="font-label-caps text-[10px] text-tertiary">{s.label.toUpperCase()}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div role="tablist" aria-label="Who to review" className="inline-flex rounded-full border border-surface-border bg-surface-container-lowest p-1 self-start">
          {(["rider", "passenger"] as Role[]).map((r) => {
            const waiting = (r === "rider" ? riders : passengers).filter((a) => a.status === "pending").length;
            return (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={role === r}
                onClick={() => setRole(r)}
                className={`h-10 px-5 rounded-full font-label-lg text-sm ${role === r ? "bg-accent-magenta text-white" : "text-secondary"}`}
              >
                {r === "rider" ? "Riders" : "Passenger ID checks"}
                {waiting > 0 ? ` (${waiting})` : ""}
              </button>
            );
          })}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, bike plate, licence"
          aria-label="Search riders"
          className="flex-1 h-12 bg-surface-container-lowest border border-surface-border rounded-full px-5 font-body-sm"
        />
      </div>

      <nav className="flex gap-2 overflow-x-auto hide-scrollbar">
        {(["pending", "approved", "rejected", "suspended"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`h-10 px-4 rounded-full font-label-lg text-sm capitalize whitespace-nowrap border ${
              filter === f ? "bg-accent-magenta text-white border-accent-magenta" : "border-surface-border bg-surface-container-lowest"
            }`}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </nav>

      <div className="max-w-full overflow-x-auto rounded-[20px] border border-surface-border bg-surface-container-lowest">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-soft-off-white text-[11px] font-bold uppercase tracking-wide text-tertiary">
            <tr>
              <th className="p-3 font-semibold">Selfie and NID</th>
              <th className="p-3 font-semibold">Applicant</th>
              <th className="p-3 font-semibold">Identity</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Review</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((app) => (
              <VerificationRow key={app.id} app={app} rides={ridesByRider.get(app.user_id) ?? []} />
            ))}
          </tbody>
        </table>
        {!shown.length && <p className="p-8 text-center text-sm text-secondary">No {role === "rider" ? "rider" : "passenger"} applications in this list.</p>}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">Live rides</h2>
        {rides
          .filter((ride) => ride.status === "requested" || ride.status === "accepted" || ride.status === "in_progress")
          .map((ride) => (
            <article key={ride.id} className="card-surface flex flex-col gap-2 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-label-lg">{ride.passenger?.full_name ?? "Passenger"}</span>
                <Icon name="arrow_forward" size={16} className="text-tertiary" />
                <span className="font-label-lg">{ride.rider?.full_name ?? "No rider yet"}</span>
                <span className="ml-auto font-label-lg">{formatTaka(ride.fare)}</span>
              </div>
              <p className="font-body-sm text-tertiary">
                {KIND_LABEL[ride.kind]} · {RIDE_STATUS_LABEL[ride.status]} · {ride.pickup_text}
                {ride.drop_text ? ` → ${ride.drop_text}` : ""}
              </p>
              {(ride.status === "requested" || ride.status === "accepted") && (
                <button
                  type="button"
                  onClick={async () => {
                    const result = await adminCancelGoRide(ride.id);
                    if (!result.error) router.refresh();
                  }}
                  className="self-end h-9 rounded-lg border border-error px-4 text-sm font-semibold text-error"
                >
                  Cancel ride
                </button>
              )}
            </article>
          ))}
        {!rides.some((ride) => ride.status === "requested" || ride.status === "accepted" || ride.status === "in_progress") && (
          <p className="card-surface p-6 text-center text-sm text-secondary">No live rides.</p>
        )}
      </section>
    </div>
  );
}

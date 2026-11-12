import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { loadAdminStats } from "@/lib/admin/queries";
import { loadRiderOverview } from "@/lib/admin/riders";
import { KIND_LABEL, RIDE_STATUS_LABEL, formatTaka } from "@/lib/go";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin();
  const [stats, riders] = await Promise.all([loadAdminStats(supabase), loadRiderOverview(supabase)]);

  const cards = [
    { label: "Riders waiting review", value: riders.pendingRiders, href: "/admin/go", icon: "hourglass_top" },
    { label: "Approved riders", value: riders.approvedRiders, href: "/admin/go", icon: "sports_motorsports" },
    { label: "Riders online now", value: riders.onlineRiders, href: "/admin/go", icon: "wifi_tethering" },
    { label: "Live rides", value: riders.liveRides, href: "/admin/go", icon: "two_wheeler" },
    { label: "Completed today", value: riders.completedToday, href: "/admin/go", icon: "task_alt" },
    { label: "Suspended riders", value: riders.suspendedRiders, href: "/admin/go", icon: "block" },
  ];

  return (
    <div>
      <div className="mb-section-gap">
        <h1 className="font-headline-xl text-headline-xl mb-2">Rider Dashboard</h1>
        <p className="font-body-lg text-secondary">Rider approvals, vehicles and rides at a glance.</p>
      </div>
      {riders.error && (
        <div className="mb-6 p-4 rounded-lg bg-error-container text-on-error-container font-body-sm">{riders.error}</div>
      )}
      {riders.pendingRiders > 0 && (
        <Link
          href="/admin/go"
          className="mb-4 flex items-start gap-3 rounded-xl border border-accent-magenta/40 bg-accent-magenta/10 p-4 hover:bg-accent-magenta/15 transition-colors"
        >
          <Icon name="sports_motorsports" filled className="text-accent-magenta mt-0.5" />
          <span>
            <span className="block font-label-lg text-on-surface">
              {riders.pendingRiders === 1 ? "1 rider application needs review" : `${riders.pendingRiders} rider applications need review`}
            </span>
            <span className="block font-body-sm text-secondary mt-1">Compare the live selfie with the NID, then check licence and bike papers.</span>
          </span>
        </Link>
      )}
      {stats.pendingApproval > 0 && (
        <Link
          href="/admin/verifications"
          className="mb-6 flex items-start gap-3 rounded-xl border border-surface-border bg-surface-container-lowest p-4 hover:shadow-premium-hover transition-shadow"
        >
          <Icon name="person_add" className="text-accent-magenta mt-0.5" />
          <span className="font-body-sm text-on-surface">
            {stats.pendingApproval === 1 ? "1 new account is" : `${stats.pendingApproval} new accounts are`} waiting to be let in.
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-gutter mb-section-gap">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-surface-container-lowest text-on-surface rounded-xl shadow-premium border border-surface-border p-5 hover:shadow-premium-hover transition-shadow"
          >
            <Icon name={card.icon} className="text-accent-magenta" />
            <p className="font-display-lg text-[32px] text-on-background mt-2">{card.value}</p>
            <p className="font-label-caps text-label-caps text-tertiary mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-gutter">
        <section className="bg-surface-container-lowest text-on-surface rounded-xl shadow-premium border border-surface-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-md text-headline-md">Newest rider applications</h2>
            <Link href="/admin/go" className="text-accent-magenta font-label-lg">
              Review
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {riders.latestApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-label-lg truncate">{app.full_name}</p>
                  <p className="font-body-sm text-tertiary truncate">
                    {app.bike_model ?? "Bike not given"} · {app.bike_plate ?? "no plate"}
                  </p>
                </div>
                <span className="font-label-caps text-[10px] text-accent-magenta capitalize shrink-0">{app.status}</span>
              </div>
            ))}
            {riders.latestApplications.length === 0 && <p className="font-body-sm text-tertiary">No rider applications yet.</p>}
          </div>
        </section>
        <section className="bg-surface-container-lowest text-on-surface rounded-xl shadow-premium border border-surface-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-md text-headline-md">Latest rides</h2>
            <Link href="/admin/go" className="text-accent-magenta font-label-lg">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {riders.latestRides.map((ride) => (
              <div key={ride.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-label-lg truncate">{ride.rider_name ?? "No rider yet"}</p>
                  <p className="font-body-sm text-tertiary truncate">
                    {KIND_LABEL[ride.kind]} · {RIDE_STATUS_LABEL[ride.status]} · {ride.pickup_text}
                  </p>
                </div>
                <span className="font-label-lg shrink-0">{formatTaka(ride.fare)}</span>
              </div>
            ))}
            {riders.latestRides.length === 0 && <p className="font-body-sm text-tertiary">No rides yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

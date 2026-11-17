import { requireAdmin } from "@/lib/supabase/require-admin";
import { formatTaka } from "@/lib/go";

const metrics = [
  ["ridesRequested", "Ride requests"],
  ["ridesCompleted", "Completed rides"],
  ["ridesCancelled", "Cancelled rides"],
  ["completedFare", "Completed ride fares"],
  ["promoRedemptions", "Promo redemptions"],
  ["promoDiscount", "Promo discounts"],
  ["captainApplications", "Captain applications"],
  ["captainApprovals", "Captain approvals"],
  ["captainRejections", "Captain rejections"],
] as const;

export async function RideReport({ start, end }: { start?: string; end?: string }) {
  const { supabase } = await requireAdmin();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const from = typeof start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : `${today.slice(0, 7)}-01`;
  const to = typeof end === "string" && /^\d{4}-\d{2}-\d{2}$/.test(end) ? end : today;
  const { data, error } = await supabase.rpc("admin_ride_report", { p_start: from, p_end: to });

  return (
    <section className="card-surface mb-6 p-5" aria-labelledby="ride-report-title">
      <h2 id="ride-report-title" className="mb-3 text-lg font-bold">Ride and Captain Report</h2>
      <form action="/admin" className="flex flex-wrap items-end gap-3">
        <label>From <input className="block rounded-lg border border-surface-border bg-surface p-2" name="start" type="date" required defaultValue={from} /></label>
        <label>To <input className="block rounded-lg border border-surface-border bg-surface p-2" name="end" type="date" required defaultValue={to} /></label>
        <button type="submit" className="btn btn-secondary">View report</button>
      </form>
      {error ? <p className="mt-3 text-error" role="alert">Report unavailable. Check the dates and select up to 366 days.</p> : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {metrics.map(([key, label]) => (
              <div key={key} className="rounded-xl bg-surface-container-lowest p-3">
                <dt className="text-sm text-secondary">{label}</dt>
                <dd className="text-lg font-bold">{key === "completedFare" || key === "promoDiscount" ? formatTaka(Number(data?.[key] ?? 0)) : Number(data?.[key] ?? 0)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-secondary">Dates use Dhaka time. Approval counts reflect the latest decision per application.</p>
          <p className="text-sm text-secondary">Insurance details {data?.insurancePublished ? "published" : "unpublished"}.</p>
        </>
      )}
    </section>
  );
}

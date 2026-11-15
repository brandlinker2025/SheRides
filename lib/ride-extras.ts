export type PromoKind = "percent" | "flat";
export type RideKind = "now" | "scheduled" | "hire";

/** Same cleaning as public.go_normalize_promo. */
export function normalizePromoCode(input: string) {
  return input.toUpperCase().replace(/[^A-Za-z0-9]/g, "").slice(0, 16);
}

/** Minimum fare the database will leave in place. Matches go_quote_promo / go_redeem_promo. */
export function fareFloor(kind: RideKind) {
  return kind === "hire" ? 250 : 70;
}

/**
 * Preview a promo the same way the database does.
 * Returns null when the code would not reduce the fare.
 */
export function quotePromo(kind: PromoKind, amount: number, fare: number, floor: number) {
  if (!Number.isFinite(fare) || fare < 1 || !Number.isFinite(amount) || amount < 1) return null;
  const raw = kind === "percent" ? Math.round((fare * amount) / 100) : amount;
  const next = Math.max(floor, fare - Math.max(0, raw));
  if (next >= fare) return null;
  return { discount: fare - next, fare: next };
}

export type EarningRide = {
  status: string;
  fare: number;
  completed_at: string | null;
};

export type EarningsSummary = {
  today: number;
  week: number;
  total: number;
  completed: number;
};

function dhakaDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Today and the last 7 days use Asia/Dhaka. Cancelled rides are not earnings. */
export function summarizeEarnings(rides: EarningRide[], now = new Date()): EarningsSummary {
  const todayKey = dhakaDayKey(now);
  const weekStart = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  let today = 0;
  let week = 0;
  let total = 0;
  let completed = 0;

  for (const ride of rides) {
    if (ride.status !== "completed" || !ride.completed_at) continue;
    const fare = Number(ride.fare);
    if (!Number.isFinite(fare) || fare < 0) continue;
    const when = new Date(ride.completed_at);
    if (Number.isNaN(when.getTime())) continue;
    completed += 1;
    total += fare;
    if (when.getTime() >= weekStart) week += fare;
    if (dhakaDayKey(when) === todayKey) today += fare;
  }

  return { today, week, total, completed };
}

export function rpcMissing(message: string) {
  return /schema cache|could not find the function|could not find the table|does not exist|PGRST202|PGRST205/i.test(message);
}

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale";
import { formatTaka } from "@/lib/go";
import { summarizeEarnings, type EarningsSummary } from "@/lib/ride-extras";
import { createClient } from "@/lib/supabase/client";

const EMPTY: EarningsSummary = { today: 0, week: 0, total: 0, completed: 0 };

export function EarningsPanel() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [summary, setSummary] = useState<EarningsSummary>(EMPTY);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user) return;
    void supabase
      .from("go_rides")
      .select("status, fare, completed_at")
      .eq("rider_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(400)
      .then(({ data }) => {
        if (!data) return;
        setSummary(summarizeEarnings(data as { status: string; fare: number; completed_at: string | null }[]));
      });
  }, [user]);

  const cells = [
    [t("earnings.today"), summary.today],
    [t("earnings.week"), summary.week],
    [t("earnings.total"), summary.total],
  ] as const;

  return (
    <section className="card-surface p-5" aria-label={t("earnings.title")}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-bold">{t("earnings.title")}</h3>
        <p className="text-sm text-[var(--sr-muted)]">{summary.completed} completed</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {cells.map(([label, amount]) => (
          <div key={label} className="rounded-2xl bg-black/25 px-2 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--sr-gold-ink)]">{label}</p>
            <p className="mt-1 text-base font-bold text-[var(--sr-heading)]">{formatTaka(amount)}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--sr-faint)]">Cash and wallet fares already recorded on completed rides. This is not a payout.</p>
    </section>
  );
}

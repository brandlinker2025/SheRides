"use client";

import { Logo } from "@/components/ui/Logo";
import { KIND_LABEL, formatTaka, formatWhen, serviceLabel, type GoRide } from "@/lib/go";
import { useLocale } from "@/lib/locale";

export function RideReceipt({
  ride,
  passengerName,
  riderName,
}: {
  ride: GoRide;
  passengerName: string | null;
  riderName: string | null;
}) {
  const { t } = useLocale();
  if (ride.status !== "completed") return null;

  return (
    <section className="card-surface p-5" aria-label={t("receipt.title")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo variant="badge" height={40} tone="auto" />
          <h2 className="text-lg font-bold">{t("receipt.title")}</h2>
        </div>
        <button type="button" onClick={() => window.print()} className="btn btn-ghost h-9 min-h-9 px-3 text-xs">
          {t("receipt.print")}
        </button>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <dt className="text-[var(--sr-faint)]">When</dt>
        <dd className="text-right">{formatWhen(ride.completed_at)}</dd>
        <dt className="text-[var(--sr-faint)]">Trip</dt>
        <dd className="text-right">{KIND_LABEL[ride.kind]}{serviceLabel(ride.service) ? ` · ${serviceLabel(ride.service)}` : ""}</dd>
        <dt className="text-[var(--sr-faint)]">From</dt>
        <dd className="text-right">{ride.pickup_text}</dd>
        <dt className="text-[var(--sr-faint)]">To</dt>
        <dd className="text-right">{ride.drop_text ?? "Hourly hire"}</dd>
        <dt className="text-[var(--sr-faint)]">Passenger</dt>
        <dd className="text-right">{passengerName ?? "—"}</dd>
        <dt className="text-[var(--sr-faint)]">Captain</dt>
        <dd className="text-right">{riderName ?? "—"}</dd>
        <dt className="text-[var(--sr-faint)]">Pay</dt>
        <dd className="text-right">{ride.payment_method === "bkash" ? "bKash" : ride.payment_method === "nagad" ? "Nagad" : "Cash"}</dd>
        <dt className="font-semibold">Total</dt>
        <dd className="text-right text-lg font-bold text-[var(--sr-heading)]">{formatTaka(ride.fare)}</dd>
      </dl>
      <p className="mt-3 text-xs text-[var(--sr-faint)]">SheRides receipt · {ride.id.slice(0, 8)} · Not a tax invoice.</p>
    </section>
  );
}

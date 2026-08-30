"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewRiderVerification } from "@/app/admin/actions";
import type { AdminVerificationRow } from "@/lib/admin/queries";
import { Avatar } from "@/components/ui/Avatar";

function maskNid(value: string) {
  if (value.length <= 4) return value;
  return `${"•".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

export function VerificationReviewTable({ rows }: { rows: AdminVerificationRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function review(row: AdminVerificationRow, approve: boolean) {
    setBusyId(row.id);
    setError(null);
    const result = await reviewRiderVerification(row.id, approve, notes[row.id] ?? "");
    setBusyId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (!rows.length) {
    return <p className="rounded-xl border border-surface-border bg-surface-container-lowest p-6 font-body-sm text-secondary">No pending verification applications.</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-error font-body-sm" role="alert">{error}</p>}
      {rows.map((row) => (
        <article key={row.id} className="rounded-xl border border-surface-border bg-surface-container-lowest shadow-premium p-5">
          <div className="flex flex-col lg:flex-row lg:items-start gap-5">
            <div className="flex items-center gap-3 min-w-0 lg:w-64">
              <Avatar src={row.profile?.avatar_url ?? null} alt={row.profile?.full_name ?? "Rider"} size={48} />
              <div className="min-w-0">
                <p className="font-label-lg truncate">{row.profile?.full_name || "Unnamed rider"}</p>
                <p className="font-body-sm text-tertiary truncate">@{row.profile?.username || "rider"}</p>
                <p className="font-body-sm text-tertiary">Submitted {new Date(row.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <div className="rounded-lg bg-soft-off-white p-3">
                <p className="font-label-caps text-[10px] text-tertiary">NID</p>
                <p className="font-body-sm" title="Masked for on-screen privacy">{maskNid(row.nid_number)}</p>
              </div>
              <div className="rounded-lg bg-soft-off-white p-3">
                <p className="font-label-caps text-[10px] text-tertiary">Driving licence</p>
                <p className="font-body-sm break-all">{row.driving_license_number || "—"}</p>
              </div>
              <div className="rounded-lg bg-soft-off-white p-3">
                <p className="font-label-caps text-[10px] text-tertiary">Chassis</p>
                <p className="font-body-sm break-all">{row.chassis_number || "—"}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col lg:flex-row gap-3 lg:items-center">
            {row.document_signed_url ? (
              <a href={row.document_signed_url} target="_blank" rel="noreferrer" className="h-11 px-4 inline-flex items-center justify-center rounded-lg border border-surface-border font-label-lg text-accent-magenta">
                Open private document (5 min)
              </a>
            ) : (
              <span className="font-body-sm text-error">Document is unavailable.</span>
            )}
            <input
              value={notes[row.id] ?? ""}
              onChange={(e) => setNotes((current) => ({ ...current, [row.id]: e.target.value }))}
              maxLength={500}
              placeholder="Review note (recommended for rejection)"
              className="flex-1 bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 font-body-sm"
            />
            <button type="button" disabled={busyId === row.id} onClick={() => void review(row, false)} className="h-11 px-4 rounded-lg border border-error text-error font-label-lg disabled:opacity-60">
              Reject
            </button>
            <button type="button" disabled={busyId === row.id || !row.document_signed_url} onClick={() => void review(row, true)} className="h-11 px-5 rounded-lg bg-accent-magenta text-white font-label-lg disabled:opacity-60">
              {busyId === row.id ? "Saving..." : "Approve rider"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

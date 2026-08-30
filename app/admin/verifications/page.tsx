import { VerificationReviewTable } from "@/components/admin/VerificationReviewTable";
import { loadAdminVerifications } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminVerificationsPage() {
  const { supabase } = await requireAdmin();
  const { verifications, error } = await loadAdminVerifications(supabase);
  const pending = verifications.filter((row) => row.status === "pending");
  const approved = verifications.filter((row) => row.status === "approved");
  const rejected = verifications.filter((row) => row.status === "rejected");

  return (
    <div>
      <div className="mb-section-gap">
        <h1 className="font-headline-xl text-headline-xl mb-2">Verification Center</h1>
        <p className="font-body-lg text-secondary">
          Review each rider&apos;s submitted identity/rider document before granting community access.
        </p>
      </div>
      {error && <p className="mb-4 text-error font-body-sm">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter mb-8">
        <div className="bg-surface-container-lowest text-on-surface rounded-xl shadow-premium border border-surface-border p-6">
          <p className="font-display-lg text-[36px]">{pending.length}</p>
          <p className="font-label-caps text-label-caps text-tertiary">Pending review</p>
        </div>
        <div className="bg-surface-container-lowest text-on-surface rounded-xl shadow-premium border border-surface-border p-6">
          <p className="font-display-lg text-[36px]">{approved.length}</p>
          <p className="font-label-caps text-label-caps text-tertiary">Approved</p>
        </div>
        <div className="bg-surface-container-lowest text-on-surface rounded-xl shadow-premium border border-surface-border p-6">
          <p className="font-display-lg text-[36px]">{rejected.length}</p>
          <p className="font-label-caps text-label-caps text-tertiary">Rejected</p>
        </div>
      </div>
      <h2 className="font-headline-md text-headline-md mb-4">Pending applications</h2>
      <VerificationReviewTable rows={pending} />
    </div>
  );
}

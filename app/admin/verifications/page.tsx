import { UsersTable } from "@/components/admin/UsersTable";
import { VerificationReviewTable } from "@/components/admin/VerificationReviewTable";
import { BackLink } from "@/components/ui/BackLink";
import { loadAdminUsers, loadAdminVerifications } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminVerificationsPage() {
  const { user, profile, supabase } = await requireAdmin();
  const currentUserId = profile?.id ?? (user.id !== "open-access" ? user.id : null);
  const [{ users, error: usersError }, { verifications, error }] = await Promise.all([
    loadAdminUsers(supabase),
    loadAdminVerifications(supabase),
  ]);
  const pendingMembers = users.filter((user) => !user.verified && user.role !== "admin");
  const pendingDocs = verifications.filter((row) => row.status === "pending");
  const approved = verifications.filter((row) => row.status === "approved");
  const rejected = verifications.filter((row) => row.status === "rejected");

  return (
    <div>
      <div className="mb-section-gap">
        <BackLink href="/admin" label="Dashboard" className="mb-3" />
        <h1 className="font-headline-xl text-headline-xl mb-2">Verifications</h1>
        <p className="font-body-lg text-secondary">
          New Join accounts wait here until you approve them. No SMS or documents are required for membership.
        </p>
      </div>
      {(usersError || error) && (
        <p className="mb-4 text-error font-body-sm">{usersError ?? error}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter mb-8">
        <div className="bg-surface-container-lowest text-on-surface rounded-xl shadow-premium border border-surface-border p-6">
          <p className="font-display-lg text-[36px]">{pendingMembers.length}</p>
          <p className="font-label-caps text-label-caps text-tertiary">Waiting for approval</p>
        </div>
        <div className="bg-surface-container-lowest text-on-surface rounded-xl shadow-premium border border-surface-border p-6">
          <p className="font-display-lg text-[36px]">{approved.length}</p>
          <p className="font-label-caps text-label-caps text-tertiary">Documents approved</p>
        </div>
        <div className="bg-surface-container-lowest text-on-surface rounded-xl shadow-premium border border-surface-border p-6">
          <p className="font-display-lg text-[36px]">{rejected.length}</p>
          <p className="font-label-caps text-label-caps text-tertiary">Documents rejected</p>
        </div>
      </div>
      <h2 className="font-headline-md text-headline-md mb-4">Waiting for approval</h2>
      <UsersTable users={pendingMembers} currentUserId={currentUserId} emptyLabel="No members waiting for approval." />
      {pendingDocs.length > 0 && (
        <div className="mt-10">
          <h2 className="font-headline-md text-headline-md mb-4">Document applications</h2>
          <VerificationReviewTable rows={pendingDocs} />
        </div>
      )}
    </div>
  );
}

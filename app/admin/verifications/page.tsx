import { UsersTable } from "@/components/admin/UsersTable";
import { loadAdminUsers } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/supabase/require-admin";

export default async function AdminVerificationsPage() {
  const { supabase } = await requireAdmin();
  const { users, error } = await loadAdminUsers(supabase);
  const pending = users.filter((user) => !user.verified);
  const verified = users.filter((user) => user.verified);

  return (
    <div>
      <div className="mb-section-gap">
        <h1 className="font-headline-xl text-headline-xl mb-2">Verification Center</h1>
        <p className="font-body-lg text-secondary">
          Approve riders to show the verified badge on their profile and posts.
        </p>
      </div>
      {error && <p className="mb-4 text-error font-body-sm">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter mb-8">
        <div className="bg-white rounded-xl shadow-premium border border-surface-border p-6">
          <p className="font-display-lg text-[36px]">{pending.length}</p>
          <p className="font-label-caps text-label-caps text-tertiary">Pending</p>
        </div>
        <div className="bg-white rounded-xl shadow-premium border border-surface-border p-6">
          <p className="font-display-lg text-[36px]">{verified.length}</p>
          <p className="font-label-caps text-label-caps text-tertiary">Verified</p>
        </div>
      </div>
      <h2 className="font-headline-md text-headline-md mb-4">Pending riders</h2>
      <UsersTable users={pending} />
    </div>
  );
}

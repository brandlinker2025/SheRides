import { EventsManager } from "@/components/admin/EventsManager";
import { BackLink } from "@/components/ui/BackLink";
import { loadAdminEvents } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/supabase/require-admin";

export default async function AdminEventsPage() {
  const { supabase } = await requireAdmin();
  const { events, error } = await loadAdminEvents(supabase);

  return (
    <div>
      <div className="mb-section-gap">
        <BackLink href="/admin" label="Dashboard" className="mb-3" />
        <h1 className="font-headline-xl text-headline-xl mb-2">Events</h1>
        <p className="font-body-lg text-secondary">Create, edit, feature, and delete rides, workshops, and meetups.</p>
      </div>
      {error && <p className="mb-4 text-error font-body-sm">{error}</p>}
      <EventsManager events={events} />
    </div>
  );
}

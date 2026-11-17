import { PlacesManager } from "@/components/admin/PlacesManager";
import { requireStaff } from "@/lib/supabase/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminPlacesPage() {
  const { supabase } = await requireStaff();
  const { data, error } = await supabase
    .from("go_places")
    .select("id, name, area, lat, lng, created_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div>
      <h1 className="font-headline-xl text-headline-xl mb-2">Places</h1>
      <p className="font-body-lg text-secondary mb-6">
        যে দোকান, অফিস বা গেট সাধারণ ম্যাপে খুঁজে পাওয়া যায় না, সেটা এখানে ম্যাপে পিন করে যোগ করুন। যাত্রী আর captain খুঁজলে এগুলো সবার আগে আসবে।
      </p>
      {error ? (
        <p className="card-surface p-5 text-error font-body-sm">
          Places database is not set up yet. Run the latest SheRides database update (go_places) in Supabase.
        </p>
      ) : (
        <PlacesManager places={(data ?? []) as { id: string; name: string; area: string | null; lat: number; lng: number }[]} />
      )}
    </div>
  );
}

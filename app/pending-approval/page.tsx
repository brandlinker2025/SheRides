import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { isApprovedProfile } from "@/lib/profile";
import { PandaStandaloneFrame } from "@/components/brand/PandaStandaloneFrame";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PendingApprovalPage() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/login");

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("verified, role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (isApprovedProfile(profile)) {
    redirect("/home");
  }

  return (
    <PandaStandaloneFrame>
      <section className="w-full bg-surface-container-lowest rounded-xl shadow-premium p-8">
        <Link href="/" className="inline-block mb-6" aria-label="SheRides home">
          <BrandLogo className="text-[42px]" />
        </Link>
        <p className="font-label-lg text-accent-magenta mb-2">MEMBERSHIP REVIEW</p>
        <h1 className="font-headline-xl text-headline-xl mb-3">Waiting for admin approval</h1>
        <p className="font-body-md text-secondary mb-6">
          Your account is in. A SheRides administrator still needs to approve you before you can use the community.
        </p>
        <div className="rounded-lg bg-soft-off-white border border-surface-border p-4 mb-6">
          <p className="font-body-sm text-secondary">
            This is not an SMS check. Stay signed in — you will be able to ride once an admin approves your membership from the dashboard.
          </p>
        </div>
        <Link
          href="/login"
          className="h-12 px-5 inline-flex items-center rounded-full border border-surface-border font-label-lg"
        >
          Back to sign in
        </Link>
      </section>
    </PandaStandaloneFrame>
  );
}

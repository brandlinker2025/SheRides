import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PendingApprovalPage() {
  const supabase = await createServerSupabase();
  const { data: authData } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  const verification = authData.user && supabase
    ? await supabase
        .from("verifications")
        .select("status, notes, created_at")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const status = verification.data?.status ?? "not_submitted";
  const title = status === "rejected" ? "Verification needs attention" : "Admin approval pending";
  const detail = status === "rejected"
    ? verification.data?.notes || "Your verification was not approved. Please submit corrected information."
    : status === "pending"
      ? "Your identity and rider details are waiting for review by a SheRides administrator."
      : "Your account exists, but rider verification has not been submitted yet.";
  const cta = status === "pending" ? null : (
    <Link href="/verification" className="h-12 px-5 inline-flex items-center rounded-full bg-accent-magenta text-white font-label-lg">
      {status === "rejected" ? "Resubmit verification" : "Complete verification"}
    </Link>
  );

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-container-margin-mobile py-section-gap">
      <section className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-premium p-8">
        <Link href="/" className="inline-block mb-6" aria-label="SheRides home">
          <BrandLogo className="text-[42px]" />
        </Link>
        <p className="font-label-lg text-accent-magenta mb-2">MEMBERSHIP REVIEW</p>
        <h1 className="font-headline-xl text-headline-xl mb-3">{title}</h1>
        <p className="font-body-md text-secondary mb-6">{detail}</p>
        <div className="rounded-lg bg-soft-off-white border border-surface-border p-4 mb-6">
          <p className="font-body-sm text-secondary">
            Community access stays locked until an administrator approves your rider verification. This protects member privacy and keeps SheRides restricted to verified riders.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {cta}
          <Link href="/login" className="h-12 px-5 inline-flex items-center rounded-full border border-surface-border font-label-lg">
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}

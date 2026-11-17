import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { isApprovedProfile } from "@/lib/profile";
import { PandaStandaloneFrame } from "@/components/brand/PandaStandaloneFrame";
import { Logo } from "@/components/ui/Logo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function leaveAccount() {
  "use server";
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}

export default async function PendingApprovalPage({ searchParams }: { searchParams: Promise<{ captain?: string }> }) {
  const captain = (await searchParams).captain === "1";
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
    redirect("/go");
  }

  return (
    <PandaStandaloneFrame>
      <section className="w-full bg-surface-container-lowest rounded-xl shadow-premium p-8">
        <Link href="/" className="inline-block mb-6" aria-label="SheRides home">
          <Logo variant="lockup" height={140} priority />
        </Link>
        <p className="font-label-lg text-accent-magenta mb-2">MEMBERSHIP REVIEW</p>
        <h1 className="font-headline-xl text-headline-xl mb-3">Waiting for admin approval</h1>
        <p className="font-body-md text-secondary mb-6">
          Your account is in. A SheRides administrator still needs to approve you before you can book or give rides.
        </p>
        <div className="rounded-lg bg-soft-off-white border border-surface-border p-4 mb-6">
          <p className="font-body-sm text-secondary">
            {captain
              ? "After approval, reopen this page to submit your Captain selfie, NID and licence for review."
              : "Once an admin approves your membership, you can continue to ride verification. No SMS code is needed."}
          </p>
        </div>
        <form action={leaveAccount}>
          <button
            type="submit"
            className="h-12 px-5 inline-flex items-center rounded-full border border-surface-border font-label-lg"
          >
            Sign out
          </button>
        </form>
      </section>
    </PandaStandaloneFrame>
  );
}

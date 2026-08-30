"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BackLink } from "@/components/ui/BackLink";
import { BrandLogo } from "@/components/ui/BrandLogo";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export default function VerificationPage() {
  const router = useRouter();
  const [nid, setNid] = useState("");
  const [license, setLicense] = useState("");
  const [chassis, setChassis] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!/^\d{10,17}$/.test(nid.trim())) {
      setError("NID must contain 10 to 17 digits.");
      return;
    }
    if (!license.trim() && !chassis.trim()) {
      setError("Add either a driving licence number or a bike chassis number.");
      return;
    }
    if (!file) {
      setError("Upload a driving licence, registration paper, or NID document image/PDF.");
      return;
    }
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_BYTES) {
      setError("Document must be JPEG, PNG, WebP, or PDF and no larger than 10 MB.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setBusy(true);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setBusy(false);
      router.replace("/login?next=/verification");
      return;
    }

    const { data: previous } = await supabase
      .from("verifications")
      .select("id,status")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previous?.status === "pending") {
      setBusy(false);
      router.replace("/pending-approval");
      return;
    }
    if (previous?.status === "approved") {
      setBusy(false);
      router.replace("/home");
      return;
    }

    const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${authData.user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("verifications").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) {
      setBusy(false);
      setError(uploadError.message);
      return;
    }

    const payload = {
      user_id: authData.user.id,
      document_type: "identity_review",
      document_url: path,
      status: "pending",
      nid_number: nid.trim(),
      driving_license_number: license.trim() || null,
      chassis_number: chassis.trim() || null,
      reviewed_at: null,
      reviewed_by: null,
      notes: null,
    };

    const result = previous?.status === "rejected"
      ? await supabase.from("verifications").update(payload).eq("id", previous.id)
      : await supabase.from("verifications").insert(payload);

    if (result.error) {
      await supabase.storage.from("verifications").remove([path]);
      setBusy(false);
      setError(result.error.message);
      return;
    }

    setBusy(false);
    router.replace("/pending-approval");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-container-margin-mobile py-section-gap">
      <section className="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-premium p-8">
        <BackLink href="/login" label="Back to sign in" className="mb-4" />
        <Link href="/" className="inline-block mb-6" aria-label="SheRides home">
          <BrandLogo className="text-[42px]" />
        </Link>
        <p className="font-label-lg text-accent-magenta mb-2">RIDER VERIFICATION</p>
        <h1 className="font-headline-xl text-headline-xl mb-2">Complete your registration</h1>
        <p className="font-body-sm text-secondary mb-6">NID is required. Also provide either your driving licence number or bike chassis number. Your documents stay in a private verification bucket.</p>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <input required inputMode="numeric" pattern="[0-9]{10,17}" maxLength={17} value={nid} onChange={(e) => setNid(e.target.value.replace(/\D/g, ""))} placeholder="NID number (10–17 digits)" className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3" />
          <input maxLength={50} value={license} onChange={(e) => setLicense(e.target.value)} placeholder="Driving licence number (or use chassis below)" className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3" />
          <input maxLength={50} value={chassis} onChange={(e) => setChassis(e.target.value)} placeholder="Bike chassis number (or use licence above)" className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3" />
          <label className="block rounded-lg border border-dashed border-surface-border bg-soft-off-white p-4">
            <span className="font-label-lg block mb-1">Verification document</span>
            <span className="font-body-sm text-secondary block mb-3">Driving licence, registration paper, or NID. JPEG/PNG/WebP/PDF, max 10 MB.</span>
            <input type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {error && <p className="text-error font-body-sm" role="alert">{error}</p>}
          <button type="submit" disabled={busy} className="h-[56px] bg-accent-magenta text-white font-label-lg rounded-full shadow-magenta disabled:opacity-60">
            {busy ? "Submitting securely..." : "Submit for Admin Approval"}
          </button>
        </form>
      </section>
    </main>
  );
}

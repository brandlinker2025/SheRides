"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent, type ReactNode } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import { goErrorMessage, uploadGoDocument, type GoRole } from "@/lib/go";
import { createClient } from "@/lib/supabase/client";

const field =
  "w-full bg-soft-off-white border border-surface-border rounded-xl px-4 py-3 font-body-md focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20";

function FilePick({
  label,
  hint,
  file,
  onPick,
  capture,
  required = true,
}: {
  label: string;
  hint: string;
  file: File | null;
  onPick: (file: File | null) => void;
  capture?: "user" | "environment";
  required?: boolean;
}) {
  return (
    <label className="flex items-center gap-4 rounded-xl border border-dashed border-surface-border bg-soft-off-white p-4 cursor-pointer hover:border-accent-magenta transition-colors">
      <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${file ? "bg-green-600 text-white" : "bg-accent-magenta/10 text-accent-magenta"}`}>
        <Icon name={file ? "check" : capture === "user" ? "photo_camera_front" : "upload_file"} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-label-lg">
          {label} {required ? <span className="text-accent-magenta">*</span> : <span className="text-tertiary font-body-sm">(optional)</span>}
        </span>
        <span className="block font-body-sm text-secondary truncate">{file ? file.name : hint}</span>
      </span>
      <input
        type="file"
        className="sr-only"
        accept={capture ? "image/*" : "image/jpeg,image/png,image/webp,application/pdf"}
        capture={capture}
        onChange={(event) => onPick(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card-surface p-6 flex flex-col gap-4">
      <h2 className="font-headline-md text-[20px] font-bold">{title}</h2>
      {children}
    </section>
  );
}

function ApplyForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const role: GoRole = params.get("role") === "rider" ? "rider" : "passenger";

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [nid, setNid] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [nidFront, setNidFront] = useState<File | null>(null);
  const [nidBack, setNidBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [bikeModel, setBikeModel] = useState("");
  const [bikePlate, setBikePlate] = useState("");
  const [bikePapers, setBikePapers] = useState<File | null>(null);
  const [declared, setDeclared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!user) return;
    if (fullName.trim().length < 2) return setError("Write your full name as on your NID.");
    if (!/^\d{10,17}$/.test(nid)) return setError("NID number must be 10 to 17 digits.");
    if (!emergencyName.trim() || !/^(\+?88)?01[3-9]\d{8}$/.test(emergencyPhone.trim())) {
      return setError("Add an emergency contact with a valid Bangladesh mobile number.");
    }
    if (!nidFront || !selfie) return setError("NID front photo and a live selfie are required.");
    if (role === "rider" && (!licenseNo.trim() || !licenseFile || !bikeModel.trim() || !bikePlate.trim() || !bikePapers)) {
      return setError("Riders must add licence number + photo, bike model, number plate and bike papers.");
    }
    if (!declared) return setError("Please confirm the declaration.");

    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    try {
      setProgress("Uploading NID…");
      const nidFrontPath = await uploadGoDocument(supabase, user.id, nidFront, "NID front");
      const nidBackPath = nidBack ? await uploadGoDocument(supabase, user.id, nidBack, "NID back") : null;
      setProgress("Uploading selfie…");
      const selfiePath = await uploadGoDocument(supabase, user.id, selfie, "Selfie");
      let licensePath: string | null = null;
      let papersPath: string | null = null;
      if (role === "rider" && licenseFile && bikePapers) {
        setProgress("Uploading licence and bike papers…");
        licensePath = await uploadGoDocument(supabase, user.id, licenseFile, "Licence");
        papersPath = await uploadGoDocument(supabase, user.id, bikePapers, "Bike papers");
      }
      setProgress("Sending for admin approval…");
      const { error: rpcError } = await supabase.rpc("go_submit_application", {
        p_role: role,
        p_full_name: fullName.trim(),
        p_nid_number: nid,
        p_emergency_name: emergencyName.trim(),
        p_emergency_phone: emergencyPhone.trim(),
        p_nid_front_path: nidFrontPath,
        p_nid_back_path: nidBackPath,
        p_selfie_path: selfiePath,
        p_license_number: role === "rider" ? licenseNo.trim() : null,
        p_license_path: licensePath,
        p_bike_model: role === "rider" ? bikeModel.trim() : null,
        p_bike_plate: role === "rider" ? bikePlate.trim() : null,
        p_bike_papers_path: papersPath,
        p_declared_female: true,
      });
      if (rpcError) throw rpcError;
      router.replace("/go?submitted=" + role);
      router.refresh();
    } catch (err) {
      setError(goErrorMessage(err));
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-container-margin-mobile lg:px-0 py-10">
      <BackLink href="/go" label="SheRides Go" className="mb-4" />
      <p className="font-label-caps text-label-caps text-accent-magenta mb-2">WOMEN-ONLY VERIFICATION</p>
      <h1 className="font-headline-xl text-headline-xl mb-2">
        {role === "rider" ? "Become a SheRides Go rider" : "Get verified to book rides"}
      </h1>
      <p className="font-body-md text-secondary mb-8">
        SheRides Go is only for women. An admin checks your face, name and NID by hand before you can{" "}
        {role === "rider" ? "carry passengers" : "book a ride"}. Your documents are stored privately and only admins can see them.
      </p>

      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5">
        <Section title="1. Your identity">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} placeholder="Full name (as on NID)" className={field} />
          <input value={nid} onChange={(e) => setNid(e.target.value.replace(/\D/g, "").slice(0, 17))} inputMode="numeric" placeholder="NID number" className={field} />
          <FilePick label="NID front" hint="Clear photo, all corners visible" file={nidFront} onPick={setNidFront} />
          <FilePick label="NID back" hint="Back side of the card" file={nidBack} onPick={setNidBack} required={false} />
          <FilePick
            label="Live selfie holding your NID"
            hint="Opens the front camera. Face and card both visible."
            file={selfie}
            onPick={setSelfie}
            capture="user"
          />
        </Section>

        <Section title="2. Emergency contact">
          <p className="font-body-sm text-secondary -mt-2">If you press SOS during a ride, the SheRides admin team contacts this person.</p>
          <input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} maxLength={80} placeholder="Name (e.g. Mother, Sister)" className={field} />
          <input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} inputMode="tel" placeholder="01XXXXXXXXX" className={field} />
        </Section>

        {role === "rider" && (
          <Section title="3. Licence & bike">
            <input value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} maxLength={40} placeholder="Driving licence number" className={field} />
            <FilePick label="Driving licence" hint="Photo or PDF" file={licenseFile} onPick={setLicenseFile} />
            <input value={bikeModel} onChange={(e) => setBikeModel(e.target.value)} maxLength={60} placeholder="Bike / scooter model (e.g. Yamaha Fascino)" className={field} />
            <input value={bikePlate} onChange={(e) => setBikePlate(e.target.value)} maxLength={30} placeholder="Number plate (e.g. Dhaka Metro-HA 12-3456)" className={field} />
            <FilePick label="Bike papers" hint="Registration + tax token (one photo or PDF)" file={bikePapers} onPick={setBikePapers} />
            <p className="font-body-sm text-secondary">
              You must carry a second clean helmet for your passenger on every ride.
            </p>
          </Section>
        )}

        <label className="card-surface p-5 flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="mt-1 h-5 w-5 accent-[#E91E63]" />
          <span className="font-body-sm">
            I confirm I am a woman and these documents are mine. I understand that a false application, or letting anyone else use my account,
            means a permanent ban from SheRides and may be reported to the police.
          </span>
        </label>

        {error && (
          <p className="font-body-sm text-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="h-14 rounded-full bg-accent-magenta text-white font-label-lg inline-flex items-center justify-center gap-2">
          <Icon name="verified_user" />
          {busy ? progress ?? "Submitting…" : "Submit for admin approval"}
        </button>
      </form>
    </div>
  );
}

export default function GoApplyPage() {
  return (
    <Suspense fallback={null}>
      <ApplyForm />
    </Suspense>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CameraCapture } from "@/components/ui/CameraCapture";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/lib/auth-context";
import { createSubmitLock, normalizeChassis, runGoApplicationSubmit, validateGoApplication } from "@/lib/go-application";
import { bikeBrandNames, bikeBrands, type BikeBrand } from "@/lib/bikes";
import { uploadGoDocument, type GoRole } from "@/lib/go";
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
  /** "user" = selfie (front camera or gallery), "environment" = document (back camera + upload) */
  capture?: "user" | "environment";
  required?: boolean;
}) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const selfie = capture === "user";
  const acceptsPdf = !selfie;

  return (
    <div className="rounded-xl border border-dashed border-surface-border bg-soft-off-white p-4 flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${file ? "bg-green-600 text-white" : "bg-accent-magenta/10 text-accent-magenta"}`}>
          <Icon name={file ? "check" : selfie ? "photo_camera_front" : "badge"} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-label-lg">
            {label} {required ? <span className="text-accent-magenta">*</span> : <span className="text-tertiary font-body-sm">(optional)</span>}
          </span>
          <span className="block font-body-sm text-secondary truncate">{file ? `✓ ${file.name}` : hint}</span>
        </span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCameraOpen(true)}
          className="flex-1 h-12 rounded-full bg-accent-magenta text-white font-label-lg inline-flex items-center justify-center gap-2"
        >
          <Icon name={selfie ? "photo_camera_front" : "photo_camera"} size={20} />
          {file ? "Retake" : selfie ? "Take selfie" : "Take photo"}
        </button>
        {!selfie && (
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            className="flex-1 h-12 rounded-full border border-surface-border bg-surface font-label-lg inline-flex items-center justify-center gap-2"
          >
            <Icon name="upload_file" size={20} />
            Upload
          </button>
        )}
      </div>

      {selfie && (
        <button type="button" onClick={() => uploadRef.current?.click()} className="self-start text-sm font-semibold underline">
          Having trouble with live camera? Upload photo from gallery
        </button>
      )}

      <input
        ref={uploadRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        accept={acceptsPdf ? "image/jpeg,image/png,image/webp,application/pdf" : "image/jpeg,image/png,image/webp"}
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) onPick(selected);
          event.currentTarget.value = "";
        }}
      />

      <CameraCapture
        open={cameraOpen}
        facing={selfie ? "user" : "environment"}
        guide={selfie ? "face" : "card"}
        title={label}
        allowSwitch={!selfie}
        onCapture={onPick}
        onClose={() => setCameraOpen(false)}
        onFallbackUpload={() => {
          setCameraOpen(false);
          uploadRef.current?.click();
        }}
      />
    </div>
  );
}

function StepHeading({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-accent-magenta text-white text-[13px] font-bold inline-flex items-center justify-center">{n}</span>
      <div className="min-w-0">
        <p className="font-label-lg">Step {n} · {title}</p>
        <p className="font-body-sm text-secondary">{sub}</p>
      </div>
    </div>
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

export function ApplyForm({ role }: { role: GoRole }) {
  const router = useRouter();
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [nid, setNid] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [nidFront, setNidFront] = useState<File | null>(null);
  const [nidBack, setNidBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [bikeBrand, setBikeBrand] = useState("");
  const [bikeModel, setBikeModel] = useState("");
  const [bikePlate, setBikePlate] = useState("");
  const [bikeChassis, setBikeChassis] = useState("");
  const [bikePapers, setBikePapers] = useState<File | null>(null);
  const [declared, setDeclared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lockRef = useRef(createSubmitLock());
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.dataset.goApply = "open";
    return () => {
      delete document.body.dataset.goApply;
    };
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    const viewport = window.visualViewport;
    if (!bar || !viewport) return;
    const place = () => {
      const covered = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      bar.style.transform = covered > 0 ? `translateY(-${covered}px)` : "";
    };
    place();
    viewport.addEventListener("resize", place);
    viewport.addEventListener("scroll", place);
    return () => {
      viewport.removeEventListener("resize", place);
      viewport.removeEventListener("scroll", place);
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const draft = {
      role,
      userId: user?.id ?? null,
      fullName,
      nid,
      emergencyName,
      emergencyPhone,
      hasNidFront: Boolean(nidFront),
      hasNidBack: Boolean(nidBack),
      hasSelfie: Boolean(selfie),
      licenseNo,
      hasLicenseFile: Boolean(licenseFile),
      bikeBrand,
      bikeModel,
      bikePlate,
      bikeChassis,
      hasBikePapers: Boolean(bikePapers),
      declared,
    };
    const problem = validateGoApplication(draft);
    if (problem) {
      setError(problem);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setError("SheRides could not connect. Please try again.");
      return;
    }
    setBusy(true);
    const result = await runGoApplicationSubmit({
      draft,
      files: { nidFront, nidBack, selfie, licenseFile, bikePapers },
      lock: lockRef.current,
      onProgress: setProgress,
      transport: {
        upload: async (slot) => {
          if (!user) throw new Error("Sign in to submit your application.");
          const file =
            slot === "nid-front" ? nidFront
            : slot === "nid-back" ? nidBack
            : slot === "selfie" ? selfie
            : slot === "licence" ? licenseFile
            : bikePapers;
          const label =
            slot === "nid-front" ? "NID front"
            : slot === "nid-back" ? "NID back"
            : slot === "selfie" ? "Selfie"
            : slot === "licence" ? "Licence"
            : "Bike papers";
          if (!file) throw new Error(`${label} is missing.`);
          return uploadGoDocument(supabase, user.id, file, label);
        },
        save: async (payload) => {
          const { error: rpcError } = await supabase.rpc("go_submit_application", payload);
          if (!rpcError) return;
          // Database not yet migrated for brand/chassis: save with the original fields so the
          // application is never lost; the brand is kept inside the model text.
          if (rpcError.code !== "PGRST202") throw rpcError;
          const { p_bike_brand, p_bike_chassis, ...legacy } = payload;
          void p_bike_chassis;
          const model = [p_bike_brand, legacy.p_bike_model].filter(Boolean).join(" ").slice(0, 60) || null;
          const { error: legacyError } = await supabase.rpc("go_submit_application", { ...legacy, p_bike_model: model });
          if (legacyError) throw legacyError;
        },
      },
    });
    if (result.ok) {
      setSaved(true);
      setProgress(null);
      router.replace(`/?flow=${role === "rider" ? "partner" : "ride"}&submitted=${role}`);
      router.refresh();
      return;
    }
    if (!result.duplicate) {
      setError(result.error ?? "Something went wrong. Please try again.");
      setProgress(null);
    }
    setBusy(false);
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-container-margin-mobile lg:px-0 py-10">

      <p className="font-label-caps text-label-caps text-accent-magenta mb-2">WOMEN-ONLY VERIFICATION</p>
      <h1 className="font-headline-xl text-headline-xl mb-2">
        {role === "rider" ? "Become a SheRides rider" : "Get verified to book rides"}
      </h1>
      <p className="font-body-md text-secondary mb-8">
        SheRides rides are only for women. An admin checks your face, name and NID by hand before you can{" "}
        {role === "rider" ? "carry passengers" : "book a ride"}. Your documents are stored privately and only admins can see them.
      </p>

      <form id="go-apply-form" onSubmit={(event) => void submit(event)} className="flex flex-col gap-5 pb-36 lg:pb-32">
        <Section title="1. Your identity">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} placeholder="Full name (as on NID)" className={field} />
          <input value={nid} onChange={(e) => setNid(e.target.value.replace(/\D/g, "").slice(0, 17))} inputMode="numeric" placeholder="NID number" className={field} />
          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <StepHeading n={1} title="Face photo" sub="Use the front camera with your face inside the oval, or upload a clear selfie." />
              <FilePick
                label="Selfie"
                hint="Opens the front camera with a face guide."
                file={selfie}
                onPick={setSelfie}
                capture="user"
              />
            </div>
            <div className="space-y-3">
              <StepHeading n={2} title="NID card" sub="Back camera, card inside the 1.58 : 1 frame. Or upload a clear photo / PDF." />
              <FilePick label="NID front" hint="Clear photo, all 4 corners visible" file={nidFront} onPick={setNidFront} capture="environment" />
              <FilePick label="NID back" hint="Back side of the card" file={nidBack} onPick={setNidBack} capture="environment" required={false} />
            </div>
          </div>
        </Section>

        <Section title="2. Emergency contact">
          <p className="font-body-sm text-secondary -mt-2">A trusted contact for the SheRides admin team. The number is not shown to captains.</p>
          <input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} maxLength={80} placeholder="Name (e.g. Mother, Sister)" className={field} />
          <input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} inputMode="tel" placeholder="01XXXXXXXXX" className={field} />
        </Section>

        {role === "rider" && (
          <Section title="3. Licence & bike">
            <input value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} maxLength={40} placeholder="Driving licence number" className={field} />
            <FilePick label="Driving licence" hint="Photo or PDF" file={licenseFile} onPick={setLicenseFile} />
            <p className="font-label-lg text-sm font-bold pt-2">Bike details</p>
            <input value={bikeBrand} onChange={(e) => setBikeBrand(e.target.value)} maxLength={40} list="sr-bike-brands" autoComplete="off" placeholder="Brand (e.g. Yamaha, Honda, TVS)" aria-label="Bike brand" className={field} />
            <datalist id="sr-bike-brands">
              {bikeBrandNames.map((name) => <option key={name} value={name} />)}
            </datalist>
            <input value={bikeModel} onChange={(e) => setBikeModel(e.target.value)} maxLength={60} list="sr-bike-models" autoComplete="off" placeholder="Model (e.g. Fascino, Ray ZR, Ntorq)" aria-label="Bike model" className={field} />
            <datalist id="sr-bike-models">
              {(bikeBrands[bikeBrand as BikeBrand] ?? []).map((name) => <option key={name} value={name} />)}
            </datalist>
            <input value={bikePlate} onChange={(e) => setBikePlate(e.target.value)} maxLength={30} placeholder="Number plate (e.g. Dhaka Metro-HA 12-3456)" aria-label="Number plate" className={field} />
            <input value={bikeChassis} onChange={(e) => setBikeChassis(normalizeChassis(e.target.value).slice(0, 25))} maxLength={25} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="Chassis number (from registration paper)" aria-label="Chassis number" className={`${field} font-mono tracking-wider`} />
            <FilePick label="Bike papers" hint="Registration + tax token (one photo or PDF)" file={bikePapers} onPick={setBikePapers} />
            <p className="font-body-sm text-secondary">
              You must carry a second clean helmet for your passenger on every ride.
            </p>
          </Section>
        )}

        <label className="card-surface p-5 flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="mt-1 h-5 w-5 accent-[#6c5ce7]" />
          <span className="font-body-sm">
            I confirm I am a woman and these documents are mine. I understand that a false application, or letting anyone else use my account,
            means a permanent ban from SheRides and may be reported to the police.
          </span>
        </label>

        <div
          ref={barRef}
          className="go-apply-bar pointer-events-none fixed inset-x-0 z-40 px-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] lg:bottom-4 lg:left-64 lg:right-0"
        >
          <div className="pointer-events-auto mx-auto w-full max-w-2xl rounded-2xl border border-white/15 bg-[#ffffff]/95 px-3 py-3 shadow-[0_10px_40px_#7044f530] backdrop-blur-xl">
            {error && (
              <p id="go-apply-error" className="mb-2 text-center font-body-sm text-red-200" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || saved}
              aria-busy={busy}
              aria-describedby={error ? "go-apply-error" : undefined}
              className="h-14 w-full rounded-full bg-gradient-to-r from-[#241b4a] via-[#6c5ce7] to-[#16708a] text-white font-label-lg inline-flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(108,92,231,0.55)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(22,112,138,0.75)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.99] disabled:pointer-events-none disabled:opacity-70 motion-reduce:transform-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <Icon name="verified_user" />
              {saved ? "Application saved" : busy ? progress ?? "Submitting…" : "Confirm & Submit Application"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

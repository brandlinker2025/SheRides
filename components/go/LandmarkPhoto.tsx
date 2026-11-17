"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { goErrorMessage } from "@/lib/go";
import { compressImage } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "ride-landmarks";

type Props = {
  rideId: string;
  myId: string;
  isPassenger: boolean;
  path: string | null | undefined;
  sentAt: string | null | undefined;
  active: boolean;
  onSent: () => void;
};

/** Passenger sends a photo of a landmark near her pickup. Only she, her captain and admins can see it. */
export function LandmarkPhoto({ rideId, myId, isPassenger, path, sentAt, active, onSent }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function sign() {
      if (!path) return setUrl(null);
      const supabase = createClient();
      if (!supabase) return;
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600);
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    }
    void sign();
    return () => {
      cancelled = true;
    };
  }, [path]);

  async function send(file: File | undefined) {
    if (!file) return;
    setError(null);
    const supabase = createClient();
    if (!supabase) return setError("SheRides could not connect. Please try again.");
    setBusy(true);
    try {
      const blob = await compressImage(file, 1280, 0.8);
      const ext = blob.type === "image/png" ? "png" : "jpg";
      const name = `${myId}/${rideId}/landmark-${Date.now()}.${ext}`;
      const upload = await supabase.storage.from(BUCKET).upload(name, blob, { contentType: blob.type, upsert: false });
      if (upload.error) throw upload.error;
      const { error: rpcError } = await supabase.rpc("go_set_landmark_photo", { p_ride_id: rideId, p_path: name });
      if (rpcError) throw rpcError;
      onSent();
    } catch (err) {
      const raw = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "";
      setError(/bucket not found|could not find the function|schema cache|PGRST202/i.test(raw)
        ? "Landmark photos start working after the database update is applied."
        : goErrorMessage(err));
    } finally {
      setBusy(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  }

  if (!isPassenger && !path) return null;

  return (
    <section className="card-surface p-5 flex flex-col gap-3" aria-label="Landmark photo">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#6366F1] text-white inline-flex items-center justify-center shrink-0">
          <Icon name="add_a_photo" size={22} />
        </span>
        <div className="min-w-0">
          <h2 className="font-label-lg text-base font-bold">Landmark photo</h2>
          <p className="font-body-sm text-secondary">
            {isPassenger
              ? "Send a photo of a shop, gate or sign near you so your captain finds you fast."
              : "Your passenger sent this photo of her pickup spot."}
          </p>
        </div>
      </div>

      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-surface-border">
          {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from private storage */}
          <img src={url} alt="Landmark near the pickup point" className="max-h-72 w-full object-cover" />
        </a>
      )}
      {path && sentAt && (
        <p className="font-body-sm text-tertiary">Sent {new Date(sentAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
      )}

      {isPassenger && active && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={busy} onClick={() => cameraRef.current?.click()} className="btn btn-primary h-12 min-h-12 text-sm">
            <Icon name="photo_camera" size={20} /> {busy ? "Sending…" : path ? "Retake" : "Take photo"}
          </button>
          <button type="button" disabled={busy} onClick={() => galleryRef.current?.click()} className="btn btn-secondary h-12 min-h-12 text-sm">
            <Icon name="photo_library" size={20} /> Gallery
          </button>
          <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={(e) => void send(e.target.files?.[0])} />
          <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void send(e.target.files?.[0])} />
        </div>
      )}
      {error && <p className="font-body-sm text-error" role="alert">{error}</p>}
    </section>
  );
}

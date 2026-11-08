"use client";

/**
 * In-page camera (getUserMedia). Works the same on every Android phone, iPhone,
 * desktop browser and inside the SheRides Android app — it does not depend on
 * the phone's own camera app or the file chooser showing a "Camera" option.
 *
 *   facing="user"        → front camera (live selfie)
 *   facing="environment" → back camera (NID / documents)
 *
 * Returns a JPEG File (max 2560 px, ~0.3–1.5 MB) via onCapture.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type Facing = "user" | "environment";
type Guide = "card" | "face";

const MAX_PX = 2560;

export function CameraCapture({
  open,
  facing = "environment",
  guide = "card",
  title,
  allowSwitch = true,
  onCapture,
  onClose,
  onFallbackUpload,
}: {
  open: boolean;
  facing?: Facing;
  guide?: Guide;
  title: string;
  allowSwitch?: boolean;
  onCapture: (file: File) => void;
  onClose: () => void;
  /** Shown only when the phone has no usable camera. */
  onFallbackUpload?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [current, setCurrent] = useState<Facing>(facing);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<{ message: string; noCamera: boolean } | null>(null);
  const [shot, setShot] = useState<{ url: string; file: File } | null>(null);
  const [attempt, setAttempt] = useState(0);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  // Reset when (re)opened
  useEffect(() => {
    if (open) {
      setCurrent(facing);
      setShot(null);
      setError(null);
    }
  }, [open, facing]);

  // Start / restart the camera stream
  useEffect(() => {
    if (!open || shot) return;
    let cancelled = false;

    (async () => {
      setError(null);
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setError({ message: "This browser cannot open the camera.", noCamera: true });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: current },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
          setReady(true);
        }
      } catch (e) {
        if (cancelled) return;
        const name = e instanceof DOMException ? e.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setError({
            message:
              "Camera permission is off. Tap Try again and choose Allow. If no prompt appears, open phone Settings → Apps → SheRides (or your browser) → Permissions → Camera → Allow.",
            noCamera: false,
          });
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setError({ message: "No camera was found on this device.", noCamera: true });
        } else if (name === "NotReadableError") {
          setError({ message: "The camera is busy in another app. Close it and tap Try again.", noCamera: false });
        } else {
          setError({ message: "Could not open the camera. Tap Try again.", noCamera: false });
        }
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [open, current, shot, attempt, stop]);

  // Free the preview URL
  useEffect(() => () => {
    if (shot) URL.revokeObjectURL(shot.url);
  }, [shot]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, MAX_PX / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h); // saved un-mirrored (text on NID reads correctly)
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `${current === "user" ? "selfie" : "photo"}-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stop();
        setShot({ url: URL.createObjectURL(blob), file });
      },
      "image/jpeg",
      0.88,
    );
  };

  const mirrored = current === "user";

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[100] bg-black text-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={onClose} aria-label="Close camera" className="h-11 w-11 inline-flex items-center justify-center rounded-full bg-white/10">
          <Icon name="close" />
        </button>
        <p className="font-label-lg text-center flex-1 px-2 truncate">{title}</p>
        {allowSwitch && !shot && !error ? (
          <button
            type="button"
            onClick={() => setCurrent((c) => (c === "user" ? "environment" : "user"))}
            aria-label="Switch camera"
            className="h-11 w-11 inline-flex items-center justify-center rounded-full bg-white/10"
          >
            <Icon name="cameraswitch" />
          </button>
        ) : (
          <span className="h-11 w-11" />
        )}
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot.url} alt="Captured photo preview" className="max-h-full max-w-full object-contain" />
        ) : error ? (
          <div className="max-w-sm px-6 text-center flex flex-col items-center gap-4">
            <Icon name="no_photography" size={48} />
            <p className="font-body-md" role="alert">{error.message}</p>
            {!error.noCamera && (
              <button type="button" onClick={() => setAttempt((n) => n + 1)} className="h-12 px-6 rounded-full bg-white text-black font-label-lg">
                Try again
              </button>
            )}
            {error.noCamera && onFallbackUpload && (
              <button type="button" onClick={onFallbackUpload} className="h-12 px-6 rounded-full bg-white text-black font-label-lg">
                Upload a photo instead
              </button>
            )}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`h-full w-full object-cover ${mirrored ? "-scale-x-100" : ""}`}
            />
            {!ready && <p className="absolute font-body-md">Opening camera…</p>}
            {/* Framing guide */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
              {guide === "card" ? (
                <div className="w-[86%] max-w-[520px] aspect-[1.586] rounded-2xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              ) : (
                <div className="w-[62%] max-w-[320px] aspect-[3/4] rounded-[50%] border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              )}
            </div>
          </>
        )}
      </div>

      <div className="px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-3">
        {!shot && !error && (
          <p className="font-body-sm text-white/80 text-center">
            {guide === "card" ? "Fit the whole card inside the frame. Avoid glare." : "Face and NID card both clearly visible."}
          </p>
        )}
        {shot ? (
          <div className="flex w-full max-w-sm gap-3">
            <button type="button" onClick={() => setShot(null)} className="flex-1 h-14 rounded-full bg-white/15 font-label-lg">
              Retake
            </button>
            <button
              type="button"
              onClick={() => {
                onCapture(shot.file);
                onClose();
              }}
              className="flex-1 h-14 rounded-full bg-accent-magenta font-label-lg"
            >
              Use photo
            </button>
          </div>
        ) : (
          !error && (
            <button
              type="button"
              onClick={takePhoto}
              disabled={!ready}
              aria-label="Take photo"
              className="h-20 w-20 rounded-full border-4 border-white bg-white/20 disabled:opacity-40 active:scale-95 transition-transform"
            />
          )
        )}
      </div>
    </div>
  );
}

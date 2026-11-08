"use client";

/**
 * In-page camera (getUserMedia), eKYC style. Works the same on every Android
 * phone, iPhone, desktop browser and inside the SheRides Android app — it does
 * not depend on the phone's camera app or the file chooser.
 *
 *   guide="face" → step 1, live selfie: one large face oval (max 280×360),
 *                  front camera, optional 3-second self-timer
 *   guide="card" → document: card frame with corner brackets, back camera
 *
 * Returns a JPEG File (max 2560 px) via onCapture. Saved un-mirrored so the
 * NID text reads correctly for the admin.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type Facing = "user" | "environment";
type Guide = "card" | "face";

const MAX_PX = 2560;
const CARD_RATIO = 1.586; // ID-1 card (NID) width / height

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
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [current, setCurrent] = useState<Facing>(facing);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<{ message: string; noCamera: boolean } | null>(null);
  const [shot, setShot] = useState<{ url: string; file: File } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);

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
      setCountdown(null);
      setTimerOn(false);
    }
  }, [open, facing, guide]);

  // Measure the camera area so the guide shapes are drawn in real pixels
  useLayoutEffect(() => {
    if (!open) return;
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, shot, error]);

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
  useEffect(
    () => () => {
      if (shot) URL.revokeObjectURL(shot.url);
    },
    [shot],
  );

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const takePhoto = useCallback(() => {
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
    ctx.drawImage(video, 0, 0, w, h);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 180);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `${guide === "face" ? "selfie" : "photo"}-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stop();
        setShot({ url: URL.createObjectURL(blob), file });
      },
      "image/jpeg",
      0.9,
    );
  }, [guide, stop]);

  // Self-timer
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      takePhoto();
      return;
    }
    const t = window.setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [countdown, takePhoto]);

  if (!open) return null;

  const mirrored = current === "user";
  const isFace = guide === "face";
  const shutter = () => {
    if (countdown !== null) {
      setCountdown(null); // tap again to cancel the timer
      return;
    }
    if (timerOn) setCountdown(3);
    else takePhoto();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[100] bg-black text-white flex flex-col select-none">
      {/* Camera / preview area */}
      <div ref={stageRef} className="relative flex-1 min-h-0 overflow-hidden">
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot.url} alt="Captured photo preview" className="absolute inset-0 h-full w-full object-contain bg-black" />
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-sm px-6 text-center flex flex-col items-center gap-4">
              <span className="h-16 w-16 rounded-full bg-white/10 inline-flex items-center justify-center">
                <Icon name="no_photography" size={32} />
              </span>
              <p className="font-body-md leading-relaxed" role="alert">{error.message}</p>
              {!error.noCamera && (
                <button type="button" onClick={() => setAttempt((n) => n + 1)} className="h-12 px-7 rounded-full bg-white text-black font-label-lg">
                  Try again
                </button>
              )}
              {error.noCamera && onFallbackUpload && (
                <button type="button" onClick={onFallbackUpload} className="h-12 px-7 rounded-full bg-white text-black font-label-lg">
                  Upload a photo instead
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`absolute inset-0 h-full w-full object-cover ${mirrored ? "-scale-x-100" : ""}`}
            />
            {!ready && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
                <span className="h-10 w-10 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                <p className="font-body-sm text-white/80">Opening camera…</p>
              </div>
            )}
            {ready && stage.w > 0 && <GuideOverlay w={stage.w} h={stage.h} guide={guide} />}
            {countdown !== null && countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-live="assertive">
                <span key={countdown} className="sr-pop text-[120px] font-bold leading-none drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
                  {countdown}
                </span>
              </div>
            )}
          </>
        )}

        {/* Top bar (over the camera) */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-6 bg-gradient-to-b from-black/70 to-transparent">
          <button type="button" onClick={onClose} aria-label="Close camera" className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full bg-black/40 backdrop-blur">
            <Icon name="close" />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <p className="font-label-lg truncate">{shot ? "Check your photo" : title}</p>
            {!shot && !error && (
              <p className="text-[12px] text-white/75 truncate">
                {isFace ? "Look straight at the camera" : "Whole card inside the frame · 1.58 : 1"}
              </p>
            )}
          </div>
          {allowSwitch && !shot && !error ? (
            <button
              type="button"
              onClick={() => setCurrent((c) => (c === "user" ? "environment" : "user"))}
              aria-label="Switch camera"
              className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full bg-black/40 backdrop-blur"
            >
              <Icon name="cameraswitch" />
            </button>
          ) : (
            <span className="h-11 w-11 shrink-0" />
          )}
        </div>

        {flash && <div className="sr-flash absolute inset-0 z-30 bg-white pointer-events-none" />}
        <style>{`.sr-pop{animation:sr-pop .9s ease-out both}@keyframes sr-pop{0%{transform:scale(.6);opacity:0}25%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:.85}}.sr-flash{animation:sr-flash .18s ease-out forwards}@keyframes sr-flash{from{opacity:.9}to{opacity:0}}@media (prefers-reduced-motion:reduce){.sr-pop,.sr-flash{animation:none}}`}</style>
      </div>

      {/* Bottom controls */}
      <div className="relative z-20 bg-black px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {shot ? (
          <div className="flex flex-col items-center gap-3">
            <p className="font-body-sm text-white/80 text-center">
              {isFace ? "Is your whole face clear and in focus?" : "Can you read every line on the card? No glare?"}
            </p>
            <div className="flex w-full max-w-sm gap-3">
              <button type="button" onClick={() => setShot(null)} className="flex-1 h-14 rounded-full bg-white/10 border border-white/25 font-label-lg inline-flex items-center justify-center gap-2">
                <Icon name="refresh" size={20} /> Retake
              </button>
              <button
                type="button"
                onClick={() => {
                  onCapture(shot.file);
                  onClose();
                }}
                className="flex-1 h-14 rounded-full bg-accent-magenta font-label-lg inline-flex items-center justify-center gap-2"
              >
                <Icon name="check" size={20} /> Use photo
              </button>
            </div>
          </div>
        ) : (
          !error && (
            <div className="flex flex-col items-center gap-4">
              <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-white/75">
                {(isFace
                  ? ["Bright light on your face", "No mask, cap or sunglasses", "Hold the phone at eye level"]
                  : ["Card flat on a dark surface", "All 4 corners visible", "No glare or blur"]
                ).map((tip) => (
                  <li key={tip} className="inline-flex items-center gap-1">
                    <Icon name="check_circle" size={14} className="text-emerald-400" /> {tip}
                  </li>
                ))}
              </ul>
              <div className="grid w-full max-w-sm grid-cols-3 items-center">
                <span />
                <button
                  type="button"
                  onClick={shutter}
                  disabled={!ready}
                  aria-label={countdown !== null ? "Cancel timer" : timerOn ? "Take photo in 3 seconds" : "Take photo"}
                  className="justify-self-center relative h-[76px] w-[76px] rounded-full border-[5px] border-white disabled:opacity-40 active:scale-95 transition-transform"
                >
                  <span className={`absolute inset-[5px] rounded-full transition-colors ${countdown !== null ? "bg-red-500" : "bg-white"}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setTimerOn((v) => !v)}
                  aria-pressed={timerOn}
                  aria-label="3 second timer"
                  className={`justify-self-end h-11 px-3 rounded-full inline-flex items-center gap-1 text-[13px] font-label-lg border ${timerOn ? "bg-white text-black border-white" : "border-white/30 text-white/85"}`}
                >
                  <Icon name="timer" size={18} /> 3s
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/** Dimmed mask with clear cut-outs, drawn in real pixels so shapes never stretch. */
function GuideOverlay({ w, h, guide }: { w: number; h: number; guide: Guide }) {
  const top = 72; // below the top bar
  const usableH = h - top - 16;

  if (guide === "face") {
    // Step 1 — face only. Large, human-proportioned oval (max 280 × 360 px),
    // centred, nothing else competing for space.
    const maxW = Math.min(280, w * 0.72);
    const maxH = Math.min(360, usableH * 0.78);
    const rx = Math.min(maxW / 2, (maxH / 2) / 1.29);
    const ry = rx * 1.29;
    const cx = w / 2;
    const cy = top + usableH / 2 - 8;

    return (
      <svg className="absolute inset-0 z-10 pointer-events-none" width={w} height={h} aria-hidden="true">
        <defs>
          <mask id="sr-face-mask">
            <rect width={w} height={h} fill="white" />
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="black" />
          </mask>
        </defs>
        <rect width={w} height={h} fill="rgba(0,0,0,0.6)" mask="url(#sr-face-mask)" />
        <ellipse cx={cx} cy={cy} rx={rx + 5} ry={ry + 5} fill="none" stroke="rgba(167,139,250,0.55)" strokeWidth={6} className="sr-breathe" />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="white" strokeWidth={3} />
        <Chip x={cx} y={cy + ry + 30} text="Keep your whole face inside the oval" />
        <style>{`.sr-breathe{animation:sr-breathe 2.4s ease-in-out infinite}@keyframes sr-breathe{0%,100%{opacity:.25}50%{opacity:.9}}@media (prefers-reduced-motion:reduce){.sr-breathe{animation:none}}`}</style>
      </svg>
    );
  }

  // Document: one big card frame with corner brackets
  const cardW = Math.min(w * 0.88, 560, (usableH * 0.8) * CARD_RATIO);
  const cardH = cardW / CARD_RATIO;
  const x = (w - cardW) / 2;
  const y = top + (usableH - cardH) / 2 - 12;
  const L = Math.min(34, cardW * 0.12);
  const r = 14;
  const corners = [
    `M${x} ${y + L} V${y + r} Q${x} ${y} ${x + r} ${y} H${x + L}`,
    `M${x + cardW - L} ${y} H${x + cardW - r} Q${x + cardW} ${y} ${x + cardW} ${y + r} V${y + L}`,
    `M${x + cardW} ${y + cardH - L} V${y + cardH - r} Q${x + cardW} ${y + cardH} ${x + cardW - r} ${y + cardH} H${x + cardW - L}`,
    `M${x + L} ${y + cardH} H${x + r} Q${x} ${y + cardH} ${x} ${y + cardH - r} V${y + cardH - L}`,
  ];

  return (
    <svg className="absolute inset-0 z-10 pointer-events-none" width={w} height={h} aria-hidden="true">
      <defs>
        <mask id="sr-card-mask">
          <rect width={w} height={h} fill="white" />
          <rect x={x} y={y} width={cardW} height={cardH} rx={r} fill="black" />
        </mask>
      </defs>
      <rect width={w} height={h} fill="rgba(0,0,0,0.58)" mask="url(#sr-card-mask)" />
      <rect x={x} y={y} width={cardW} height={cardH} rx={r} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
      {corners.map((d) => (
        <path key={d} d={d} fill="none" stroke="white" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <Chip x={w / 2} y={y + cardH + 26} text="Fit the NID card inside the frame" />
    </svg>
  );
}

function Chip({ x, y, text }: { x: number; y: number; text: string }) {
  const width = text.length * 7.2 + 24;
  return (
    <g>
      <rect x={x - width / 2} y={y - 13} width={width} height={26} rx={13} fill="rgba(0,0,0,0.55)" />
      <text x={x} y={y + 4.5} textAnchor="middle" fill="white" fontSize={13} fontWeight={600} fontFamily="inherit">
        {text}
      </text>
    </g>
  );
}

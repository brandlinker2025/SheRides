"use client";

import { useEffect, useRef, useState } from "react";

export function ImagePositioner({ file, kind, onCancel, onConfirm }: { file: File; kind: "avatar" | "cover"; onCancel: () => void; onConfirm: (file: File) => void }) {
  const [url, setUrl] = useState("");
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  function pointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x, y };
  }
  function pointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.px) / Math.max(rect.width, 1)) * 100;
    const dy = ((e.clientY - drag.current.py) / Math.max(rect.height, 1)) * 100;
    setX(Math.max(0, Math.min(100, drag.current.x - dx)));
    setY(Math.max(0, Math.min(100, drag.current.y - dy)));
  }

  async function crop() {
    setBusy(true);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const targetW = kind === "cover" ? 1200 : 600;
      const targetH = kind === "cover" ? 400 : 600;
      const targetAspect = targetW / targetH;
      const sourceAspect = image.naturalWidth / image.naturalHeight;
      let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;
      if (sourceAspect > targetAspect) {
        sw = image.naturalHeight * targetAspect;
        sx = (image.naturalWidth - sw) * (x / 100);
      } else if (sourceAspect < targetAspect) {
        sh = image.naturalWidth / targetAspect;
        sy = (image.naturalHeight - sh) * (y / 100);
      }
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not prepare image.");
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, targetW, targetH);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("Could not prepare image.");
      onConfirm(new File([blob], `${kind}-${Date.now()}.jpg`, { type: "image/jpeg" }));
    } finally {
      setBusy(false);
    }
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-deep-charcoal/70 p-4">
    <div className="w-full max-w-xl rounded-xl bg-surface-container-lowest p-4 shadow-premium-hover">
      <h3 className="font-headline-md text-headline-md mb-1">Position your {kind === "cover" ? "cover" : "profile photo"}</h3>
      <p className="font-body-sm text-secondary mb-3">Drag the picture until it looks right.</p>
      <div
        className={`${kind === "cover" ? "aspect-[3/1]" : "aspect-square max-w-[360px] mx-auto rounded-full"} relative overflow-hidden bg-soft-off-white cursor-grab active:cursor-grabbing touch-none select-none`}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        {url ? <img src={url} alt="Preview" draggable={false} className="absolute inset-0 h-full w-full object-cover pointer-events-none" style={{ objectPosition: `${x}% ${y}%` }} /> : null}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-surface-border">Cancel</button>
        <button type="button" disabled={busy} onClick={() => void crop()} className="px-4 py-2 rounded-lg bg-accent-magenta text-white disabled:opacity-60">{busy ? "Preparing..." : "Use photo"}</button>
      </div>
    </div>
  </div>;
}

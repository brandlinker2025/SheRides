"use client";

import { useEffect, useState, type ReactNode } from "react";

type DustumiSubmitButtonProps = {
  dodgeToken: number;
  busy?: boolean;
  children: ReactNode;
};

export function DustumiSubmitButton({ dodgeToken, busy = false, children }: DustumiSubmitButtonProps) {
  const [shift, setShift] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!dodgeToken) return;
    const dir = Math.random() < 0.5 ? -1 : 1;
    setShift({
      x: dir * (96 + Math.random() * 84),
      y: (Math.random() - 0.45) * 40,
    });
    const timer = window.setTimeout(() => setShift({ x: 0, y: 0 }), 520);
    return () => window.clearTimeout(timer);
  }, [dodgeToken]);

  return (
    <button
      type="submit"
      disabled={busy}
      style={{ transform: `translate(${shift.x}px, ${shift.y}px)` }}
      className="dustumi-btn inline-flex h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#FF2D78] font-label-lg text-white shadow-magenta transition-[transform,background-color,opacity] duration-300 hover:bg-[#e2165f] disabled:pointer-events-none disabled:opacity-60"
    >
      {children}
    </button>
  );
}

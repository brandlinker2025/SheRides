"use client";

import { useEffect, useState, type ReactNode } from "react";

type DustumiSubmitButtonProps = {
  dodgeToken: number;
  busy?: boolean;
  children: ReactNode;
};

export function DustumiSubmitButton({ dodgeToken, busy = false, children }: DustumiSubmitButtonProps) {
  const [pose, setPose] = useState<{ side: "left" | "right" | "center" }>({ side: "center" });

  useEffect(() => {
    if (!dodgeToken) return;
    setPose({ side: Math.random() < 0.5 ? "left" : "right" });
    const timer = window.setTimeout(() => setPose({ side: "center" }), 720);
    return () => window.clearTimeout(timer);
  }, [dodgeToken]);

  const dodging = pose.side !== "center";

  return (
    <div className="dustumi-wrap relative h-[56px] w-full">
      <button
        type="submit"
        disabled={busy}
        className={`dustumi-btn absolute top-0 inline-flex h-[56px] items-center justify-center gap-2 rounded-full bg-[#FF2D78] font-label-lg text-white shadow-magenta hover:bg-[#e2165f] disabled:pointer-events-none disabled:opacity-60 ${
          pose.side === "right" ? "dustumi-btn--right" : pose.side === "left" ? "dustumi-btn--left" : "dustumi-btn--center"
        } ${dodging ? "dustumi-btn--away" : ""}`}
      >
        {children}
      </button>
    </div>
  );
}

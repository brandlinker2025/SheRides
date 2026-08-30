"use client";

import type { PandaMood } from "./panda-types";
import "./auth-panda.css";

export type { PandaMood } from "./panda-types";

type InteractivePandaProps = {
  mood: PandaMood;
  track?: number;
};

export function InteractivePanda({ mood, track = 0 }: InteractivePandaProps) {
  const look = mood === "look" || mood === "track";
  const covering = mood === "cover";
  const peeking = mood === "peek";
  const sad = mood === "sad";
  const happy = mood === "happy";
  const gazeShift = look ? -8 - Math.min(track, 16) * 0.25 : sad ? 2 : 0;

  return (
    <div className="panda-fx pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">
      <div className="absolute inset-y-[10%] right-0 h-auto w-[58%] max-w-[720px] sm:w-[52%]">
        <div
          className={`panda-fx-layer panda-fx-gaze absolute left-[22%] top-[16%] h-[28%] w-[38%] rounded-[46%] bg-[radial-gradient(circle_at_40%_40%,rgba(255,214,228,0.28),transparent_70%)] blur-xl ${
            look ? "opacity-70" : "opacity-0"
          }`}
          style={{ transform: `translate3d(${gazeShift}px, 2px, 0)` }}
        />

        <div
          className={`panda-fx-layer absolute left-[24%] top-[22%] h-[16%] w-[18%] rounded-[46%] bg-[#1a1c1e] blur-md ${
            covering ? "opacity-55" : peeking ? "opacity-28" : "opacity-0"
          }`}
          style={{ transform: peeking ? "translate3d(-10px, 0, 0)" : undefined }}
        />
        <div
          className={`panda-fx-layer absolute left-[44%] top-[22%] h-[16%] w-[18%] rounded-[46%] bg-[#1a1c1e] blur-md ${
            covering ? "opacity-55" : peeking ? "opacity-28" : "opacity-0"
          }`}
          style={{ transform: peeking ? "translate3d(10px, 0, 0)" : undefined }}
        />

        {sad ? (
          <>
            <span className="panda-fx-tear absolute left-[32%] top-[34%] h-2.5 w-1.5 rounded-[40%_40%_60%_60%] bg-[#9fd0ee]/70" />
            <span
              className="panda-fx-tear absolute left-[50%] top-[35%] h-2.5 w-1.5 rounded-[40%_40%_60%_60%] bg-[#9fd0ee]/70"
              style={{ animationDelay: "0.28s" }}
            />
          </>
        ) : null}

        {happy ? (
          <>
            <span className="panda-fx-heart absolute left-[12%] top-[8%] text-sm text-[#E91E63]/80">♥</span>
            <span
              className="panda-fx-heart absolute right-[18%] top-[6%] text-xs text-[#ff8fb3]/80"
              style={{ animationDelay: "0.2s" }}
            >
              ♥
            </span>
            <span className="panda-fx-sparkle absolute left-[28%] top-[4%] text-[#ffd6e4]">✦</span>
            <span
              className="panda-fx-sparkle absolute right-[24%] top-[16%] text-[#E91E63]/70"
              style={{ animationDelay: "0.35s" }}
            >
              ✦
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

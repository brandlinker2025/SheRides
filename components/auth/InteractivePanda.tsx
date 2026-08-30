"use client";

import Image from "next/image";
import { isPandaOverlayMood, type PandaMood } from "./panda-types";
import "./auth-panda.css";

export type { PandaMood } from "./panda-types";

const PANDA_STATES: Record<PandaMood, string> = {
  idle: "/images/panda/idle.png",
  look: "/images/panda/look-left.png",
  track: "/images/panda/look-left.png",
  cover: "/images/panda/cover-eyes.png",
  peek: "/images/panda/peek.png",
  sad: "/images/panda/sad.png",
  happy: "/images/panda/happy.png",
};

const PANDA_ASSETS = [
  "/images/panda/idle.png",
  "/images/panda/look-left.png",
  "/images/panda/cover-eyes.png",
  "/images/panda/peek.png",
  "/images/panda/sad.png",
  "/images/panda/happy.png",
];

const DEFAULT_SPEECH: Record<PandaMood, string> = {
  idle: "Hey Rider! ♥ Log in to continue your journey!",
  look: "I'm listening… over here!",
  track: "Typing looks good from here.",
  cover: "I won't peek, promise!",
  peek: "Just a tiny peek…",
  sad: "Oh no… try again?",
  happy: "Yay! Let's ride! ♥",
};

type InteractivePandaProps = {
  mood: PandaMood;
  speech?: string;
  admin?: boolean;
};

export function InteractivePanda({ mood, speech, admin = false }: InteractivePandaProps) {
  const active = PANDA_STATES[mood];
  const showOverlay = isPandaOverlayMood(mood);
  const message =
    speech ??
    (admin && mood === "idle" ? "Admin access only. I’ll keep watch." : DEFAULT_SPEECH[mood]);

  return (
    <div className="panda-stage pointer-events-none absolute inset-0" aria-hidden="true">
      {showOverlay
        ? PANDA_ASSETS.map((src) => (
            <div
              key={src}
              className={`absolute left-[6%] bottom-[2%] h-[86%] w-[72%] max-w-[540px] sm:left-[10%] sm:w-[64%] ${
                src === active ? "panda-state is-active" : "panda-state"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(min-width: 1024px) 36vw, 80vw"
                priority={src === PANDA_STATES.cover}
                className="object-contain object-bottom select-none"
              />
            </div>
          ))
        : null}

      <div
        key={message}
        className="panda-speech absolute left-3 top-3 z-20 max-w-[200px] rounded-2xl bg-white px-3 py-2 text-[11px] font-medium leading-snug text-[#2a1a22] shadow-[0_12px_28px_rgba(0,0,0,0.28)] sm:left-6 sm:top-6 sm:max-w-[260px] sm:px-3.5 sm:py-2.5 sm:text-[13px]"
      >
        {message}
      </div>
    </div>
  );
}

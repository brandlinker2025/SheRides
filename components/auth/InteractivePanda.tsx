"use client";

import Image from "next/image";
import type { PandaMood } from "./panda-types";
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

type InteractivePandaProps = {
  mood: PandaMood;
};

export function InteractivePanda({ mood }: InteractivePandaProps) {
  const active = PANDA_STATES[mood];

  return (
    <div className="panda-stage relative h-full w-full" aria-hidden="true">
      {PANDA_ASSETS.map((src) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 90vw"
          priority={src === PANDA_STATES.idle}
          className={`object-contain object-bottom select-none ${src === active ? "panda-state is-active" : "panda-state"}`}
        />
      ))}
    </div>
  );
}

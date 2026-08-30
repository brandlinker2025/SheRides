"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { PandaMood } from "./panda-types";
import "./auth-panda.css";

export type { PandaMood } from "./panda-types";

const PANDA_ART = "/images/sherides-panda-auth.png";

type InteractivePandaProps = {
  mood: PandaMood;
  track?: number;
  speech?: string;
  admin?: boolean;
};

const SPEECH: Record<PandaMood, string> = {
  idle: "Hey Rider! ❤️ Log in to continue your journey!",
  look: "I'm listening… over here!",
  track: "Typing looks good from here.",
  cover: "I won't peek, promise!",
  peek: "Just a tiny peek…",
  sad: "Oh no… try again?",
  happy: "Yay! Let's ride! ❤️",
};

export function InteractivePanda({ mood, track = 0, speech, admin = false }: InteractivePandaProps) {
  const [blink, setBlink] = useState(false);
  const message =
    speech ??
    (admin && mood === "idle" ? "Admin access only. I’ll keep watch." : SPEECH[mood]);
  const typing = Math.min(Math.max(track, 0), 18);

  useEffect(() => {
    if (mood === "cover") return;
    const tick = () => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 160);
    };
    const start = window.setTimeout(tick, 1600);
    const loop = window.setInterval(tick, 3300);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(loop);
    };
  }, [mood]);

  const pose = useMemo(() => {
    const towardForm = -(6 + typing * 0.28);
    const head =
      mood === "sad"
        ? "rotate(-6deg) translate3d(-2px, 10px, 0)"
        : mood === "happy"
          ? "rotate(-5deg) translate3d(-4px, -3px, 0)"
          : mood === "look"
            ? "rotate(-8deg) translate3d(-8px, 1px, 0)"
            : mood === "track"
              ? `rotate(${-8 - typing * 0.12}deg) translate3d(${-8 - typing * 0.3}px, 1px, 0)`
              : "rotate(-5deg) translate3d(-4px, 0, 0)";

    return {
      head,
      pupilX: mood === "cover" ? 0 : mood === "peek" ? -3 : mood === "sad" ? -4 : towardForm,
      pupilY: mood === "sad" ? 4 : mood === "happy" ? -1 : 1,
      lidsClosed: mood === "cover" || blink,
      lidPeek: mood === "peek",
    };
  }, [mood, typing, blink]);

  return (
    <div className="panda-stage relative mx-auto h-full min-h-[220px] w-full max-w-[560px]" aria-hidden="true">
      <div className="relative h-full w-full">
        <div className="absolute inset-0 overflow-hidden rounded-[28px]">
          <Image
            src={PANDA_ART}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="pointer-events-none object-cover object-[86%_40%] select-none"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
        </div>

        <div className={`absolute inset-0 ${mood === "happy" ? "panda-breathe is-happy" : "panda-breathe"}`}>
          <div
            className="panda-head absolute left-[29%] top-[10%] z-10 h-[46%] w-[46%]"
            style={{ transform: pose.head }}
          >
            <Eye side="left" pose={pose} />
            <Eye side="right" pose={pose} />
            {mood === "sad" ? (
              <div className="panda-mouth absolute left-1/2 top-[68%] h-[10%] w-[22%] -translate-x-1/2 rounded-[0_0_90%_90%] border-b-[3px] border-[#4d3036]/80" />
            ) : null}
            {mood === "happy" ? (
              <div className="panda-mouth absolute left-1/2 top-[64%] h-[12%] w-[24%] -translate-x-1/2 overflow-hidden rounded-[20%_20%_60%_60%] bg-[#3a2028]/70">
                <div className="absolute inset-x-[20%] bottom-0 h-[42%] rounded-t-full bg-[#e56b86]" />
              </div>
            ) : null}
          </div>

          <Paws
            covering={mood === "cover" || mood === "peek"}
            peek={mood === "peek"}
            celebrating={mood === "happy"}
            sad={mood === "sad"}
          />
          {mood === "sad" ? <Tears /> : null}
          {mood === "happy" ? <Hearts /> : null}
        </div>
      </div>

      <div
        key={message}
        className="panda-speech pointer-events-none absolute left-[2%] top-1 z-20 max-w-[200px] rounded-2xl bg-white px-3 py-2 text-[12px] font-medium leading-snug text-[#2a1a22] shadow-[0_10px_24px_rgba(0,0,0,0.22)] sm:left-[6%] sm:max-w-[240px] sm:text-[13px]"
      >
        {message}
        <span className="absolute -bottom-1.5 right-10 h-3 w-3 rotate-45 bg-white" />
      </div>
    </div>
  );
}

function Eye({
  side,
  pose,
}: {
  side: "left" | "right";
  pose: { pupilX: number; pupilY: number; lidsClosed: boolean; lidPeek: boolean };
}) {
  const peekShift = pose.lidPeek ? (side === "left" ? -6 : 6) : 0;
  return (
    <div
      className={`absolute top-[36%] h-[22%] w-[23%] overflow-hidden rounded-full bg-[#f4f7fb] shadow-[0_0_0_6px_#2a2c30,0_4px_10px_rgba(0,0,0,0.25)] ${
        side === "left" ? "left-[16%]" : "right-[16%]"
      }`}
    >
      <div
        className="panda-eye absolute left-1/2 top-1/2 h-[80%] w-[80%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 36% 30%, #d09258 0%, #8a5a32 40%, #5c3a22 76%, #2a160e 100%)",
          transform: `translate(calc(-50% + ${pose.pupilX + peekShift}px), calc(-50% + ${pose.pupilY}px))`,
        }}
      >
        <span className="absolute left-[16%] top-[14%] h-[30%] w-[30%] rounded-full bg-white/90" />
        <span className="absolute right-[20%] bottom-[16%] h-[12%] w-[12%] rounded-full bg-white/45" />
        <span className="absolute left-1/2 top-1/2 h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1b120e]" />
      </div>
      <div
        className={`panda-lid absolute inset-x-0 top-0 z-10 bg-[#2a2c30] ${pose.lidsClosed ? "is-closed" : ""}`}
        style={{ height: pose.lidPeek ? "34%" : pose.lidsClosed ? "100%" : "10%" }}
      />
      <div
        className="panda-lid absolute inset-x-0 bottom-0 z-10 bg-[#2a2c30]"
        style={{ height: pose.lidsClosed && !pose.lidPeek ? "100%" : pose.lidPeek ? "16%" : "8%" }}
      />
    </div>
  );
}

function Paws({
  covering,
  peek,
  celebrating,
  sad,
}: {
  covering: boolean;
  peek: boolean;
  celebrating: boolean;
  sad: boolean;
}) {
  const gap = peek ? 7 : 0;
  const left = covering
    ? { top: "22%", left: `${24 + gap}%`, rotate: peek ? "-10deg" : "-3deg" }
    : celebrating
      ? { top: "6%", left: "10%", rotate: "-26deg" }
      : sad
        ? { top: "68%", left: "16%", rotate: "14deg" }
        : { top: "64%", left: "8%", rotate: "10deg" };
  const right = covering
    ? { top: "22%", right: `${24 + gap}%`, rotate: peek ? "10deg" : "3deg" }
    : celebrating
      ? { top: "6%", right: "10%", rotate: "26deg" }
      : sad
        ? { top: "68%", right: "16%", rotate: "-10deg" }
        : { top: "58%", right: "10%", rotate: "-18deg" };

  return (
    <>
      <Paw style={{ top: left.top, left: left.left, transform: `rotate(${left.rotate})` }} />
      <Paw style={{ top: right.top, right: right.right, transform: `rotate(${right.rotate})` }} />
    </>
  );
}

function Paw({ style }: { style: CSSProperties }) {
  return (
    <div className="panda-paw absolute z-30 h-[15%] w-[18%]" style={style}>
      <div
        className="h-full w-full rounded-[48%_48%_42%_42%] shadow-[0_8px_16px_rgba(0,0,0,0.28)]"
        style={{
          background: "radial-gradient(circle at 40% 28%, #fff 0%, #f6f1ea 58%, #e4d2c6 100%)",
        }}
      >
        <span className="absolute bottom-[16%] left-1/2 h-[28%] w-[34%] -translate-x-1/2 rounded-full bg-[#2c241f]/80" />
        <span className="absolute left-[15%] top-[20%] h-[18%] w-[18%] rounded-full bg-[#2c241f]/55" />
        <span className="absolute left-1/2 top-[12%] h-[16%] w-[16%] -translate-x-1/2 rounded-full bg-[#2c241f]/55" />
        <span className="absolute right-[15%] top-[20%] h-[18%] w-[18%] rounded-full bg-[#2c241f]/55" />
      </div>
    </div>
  );
}

function Tears() {
  return (
    <>
      <span className="panda-tear absolute left-[38%] top-[36%] z-40 h-3 w-2 rounded-[40%_40%_60%_60%] bg-[#8ec8f0]" />
      <span
        className="panda-tear absolute right-[36%] top-[38%] z-40 h-3 w-2 rounded-[40%_40%_60%_60%] bg-[#8ec8f0]"
        style={{ animationDelay: "0.3s" }}
      />
    </>
  );
}

function Hearts() {
  return (
    <>
      <span className="panda-heart absolute left-[14%] top-[8%] z-40 text-lg text-[#e91e63]">♥</span>
      <span className="panda-heart absolute right-[16%] top-[4%] z-40 text-base text-[#ff8fb3]" style={{ animationDelay: "0.22s" }}>
        ♥
      </span>
      <span className="panda-sparkle absolute left-[24%] top-[1%] z-40 text-[#ffd6e4]">✦</span>
      <span className="panda-sparkle absolute right-[22%] top-[14%] z-40 text-[#e91e63]" style={{ animationDelay: "0.4s" }}>
        ✦
      </span>
    </>
  );
}

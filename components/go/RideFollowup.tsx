"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

const PRAISE = ["Felt 100% Safe", "Smooth Riding", "Clean Helmet", "Speed Limits", "Polite & Kind", "Punctual"];
const AUDIT = [
  "Did the captain wear and fasten a helmet?",
  "Was the vehicle women-only, with no extra passenger?",
  "Did the ride stay on the agreed route?",
];
const TIPS = [20, 50, 100];

type Captain = {
  name: string;
  bike: string;
  plate: string;
  rating: string;
  rides: string;
};

/** In-transit layout. Speed, helmet vision, and guardian names are not stored, so they stay labeled as missing. */
export function LiveRideBoard({
  pickup,
  drop,
  fleet,
  captain,
  positionLabel,
}: {
  pickup: string;
  drop: string | null;
  fleet: string | null;
  captain: Captain | null;
  positionLabel: string | null;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-[28px] border border-[var(--sr-line)] bg-white p-4 text-[var(--sr-ink)]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--sr-gold-ink)]">Active ride · in transit</p>
        <span className="rounded-full bg-[#ffb95f]/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--sr-gold-ink)]">Protected journey</span>
      </div>
      <div className="grid gap-2 text-sm">
        <p><span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--sr-heading)]">Pickup</span>{pickup}</p>
        <p><span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--sr-gold-ink)]">Destination</span>{drop ?? "No destination on this ride"}</p>
      </div>
      <div className="rounded-2xl bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] p-3">
        <p className="text-sm font-semibold">Live telematics</p>
        <p className="mt-1 text-sm text-[var(--sr-muted)]">{positionLabel ?? "The captain's phone has not shared a position yet."}</p>
        <p className="mt-2 text-xs text-[var(--sr-faint)]">Speed is not recorded yet. A km/h figure here would be invented, so it is left blank.</p>
        {fleet && <p className="mt-2 text-xs text-[var(--sr-muted)]">{fleet}</p>}
      </div>
      <div className="rounded-2xl bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] p-3">
        <p className="text-sm font-semibold">Helmet</p>
        <p className="mt-1 text-sm text-[var(--sr-muted)]">Helmet status is not recorded on this ride. This is not a computer-vision check and not a verified pass.</p>
      </div>
      <div className="rounded-2xl bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--sr-faint)]">Captain</p>
        {captain ? (
          <>
            <p className="text-lg font-bold">{captain.name}</p>
            <p className="text-sm text-[var(--sr-muted)]">{captain.bike} · {captain.plate}</p>
            <p className="text-sm text-[var(--sr-muted)]">{captain.rating} · {captain.rides}</p>
          </>
        ) : (
          <p className="text-sm text-[var(--sr-muted)]">No captain is assigned yet. A name shown here would not be a verified person.</p>
        )}
      </div>
      <div className="rounded-2xl border border-[#ffb95f]/25 bg-[var(--sr-card-solid)] p-3">
        <p className="text-sm font-semibold">Sanctuary protocol</p>
        <p className="mt-1 text-sm text-[var(--sr-muted)]">Use in-app chat on this page, and share the trip link with someone you trust. Family names are not stored on this ride.</p>
      </div>
    </section>
  );
}

export function RideRating({
  personName,
  busy,
  onSubmit,
}: {
  personName: string;
  busy: boolean;
  onSubmit: (stars: number, feedback: string) => void;
}) {
  const [stars, setStars] = useState(0);
  const [praise, setPraise] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, "Yes" | "No" | "">>({});
  const [tip, setTip] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  function submit() {
    const lines = [
      praise.length ? `Praise: ${praise.join(", ")}` : "",
      ...AUDIT.map((question) => (answers[question] ? `${question} ${answers[question]}` : "")),
      tip != null ? `Requested tip ৳${tip}. Not transferred. Tips are not collected in the app yet.` : "No tip selected. Tips are not collected in the app yet.",
      message.trim(),
    ].filter(Boolean);
    onSubmit(stars, lines.join("\n").slice(0, 500));
  }

  return (
    <section className="flex flex-col gap-4 rounded-[28px] border border-[var(--sr-line)] bg-white p-4 text-[var(--sr-ink)]">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--sr-gold-ink)]">Trip completed</p>
        <h2 className="text-xl font-bold">How was your ride with {personName}?</h2>
      </div>
      <div className="flex gap-1" role="group" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setStars(n)} aria-label={`${n} stars`}>
            <Icon name="star" filled={n <= stars} className={`text-[32px] ${n <= stars ? "text-[var(--sr-gold-ink)]" : "text-[#460377]/25"}`} />
          </button>
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold">What did they do best?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRAISE.map((item) => {
            const selected = praise.includes(item);
            return (
              <button key={item} type="button" onClick={() => setPraise((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]))} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selected ? "bg-[#460377]/10 text-[var(--sr-heading)]" : "bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] text-[var(--sr-muted)]"}`}>
                {item}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Sanctuary protocol audit</p>
        <p className="text-xs text-[var(--sr-faint)]">Saved with your rating. There is no separate audit queue yet.</p>
        {AUDIT.map((question) => (
          <div key={question} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] px-3 py-2 text-sm">
            <span>{question}</span>
            <span className="flex shrink-0 gap-1">
              {(["Yes", "No"] as const).map((answer) => (
                <button key={answer} type="button" onClick={() => setAnswers((current) => ({ ...current, [question]: answer }))} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${answers[question] === answer ? "bg-[#FF6772] text-[#460377]" : "bg-[var(--sr-chip)] text-[var(--sr-muted)]"}`}>
                  {answer}
                </button>
              ))}
            </span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold">Tip</p>
        <p className="text-xs text-[var(--sr-faint)]">Tips are not collected in the app yet. Choosing an amount does not move money.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIPS.map((amount) => (
            <button key={amount} type="button" onClick={() => setTip(amount)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${tip === amount ? "bg-[#FFB804]/40 text-[var(--sr-gold-ink)]" : "bg-[var(--sr-card-solid)] shadow-[var(--sr-shadow)] text-[var(--sr-muted)]"}`}>
              ৳{amount}
            </button>
          ))}
        </div>
      </div>
      <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={300} rows={2} placeholder="Message (optional)" className="w-full rounded-2xl border border-[var(--sr-line)] bg-[var(--sr-inset)] px-4 py-3 text-sm" />
      <button type="button" disabled={busy || !stars} onClick={submit} className="h-14 rounded-full bg-[#FF6772] text-base font-semibold text-[#460377] disabled:bg-[var(--sr-chip)] disabled:text-[var(--sr-faint)]">
        Submit Rating & Feedback
      </button>
    </section>
  );
}

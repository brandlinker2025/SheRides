"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import "@/components/public-app/public-app.css";

export function StaffPinLogin({ slug }: { slug: string }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/staff-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, pin }),
      });
      const data = (await res.json()) as { ok?: boolean; next?: string; error?: string };
      if (data.ok && data.next) {
        window.location.replace(data.next);
        return;
      }
      setError(data.error ?? "PIN মিলছে না।");
      setPin("");
    } catch {
      setError("No connection. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="public-app public-app-home">
      <div className="public-panel">
        <div className="mb-4 flex justify-center">
          <Logo variant="lockup" tone="light" height={110} priority />
        </div>
        <h1 className="text-center text-2xl font-extrabold text-[#251b3a]">SheRides Admin</h1>
        <p className="mt-1 mb-5 text-center text-sm text-[#5e5276]">এই ফোনে প্রথমবার শুধু আপনার ৬ সংখ্যার PIN দিন। এরপর এই লিংক খুললেই সরাসরি panel খুলবে।</p>
        <form onSubmit={(e) => void submit(e)} className="grid gap-3">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            aria-label="PIN"
            placeholder="••••••"
            className="h-16 rounded-2xl border border-[#e4d8ff] bg-[#f8f4ff] text-center text-3xl font-extrabold tracking-[0.5em] text-[#251b3a]"
          />
          <button type="submit" disabled={busy || pin.length !== 6} className="public-action public-mint w-full">
            <Icon name="login" size={22} /> {busy ? "ঢুকছে…" : "Enter"}
          </button>
          {error && <p className="text-center text-sm text-[#a82144]" role="alert">{error}</p>}
        </form>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import "@/components/public-app/public-app.css";

/** Admin and moderator sign-in: email only. A one-time login link is emailed; no password. */
export function StaffLoginPanel() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/staff-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: string; error?: string };
      if (data.ok) setSent(data.ok);
      else setError(data.error ?? "Could not send the login link.");
    } catch {
      setError("No connection. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="public-app public-app-home">
      <div className="public-panel staff-login">
        <div className="mb-4 flex justify-center">
          <Logo variant="lockup" tone="light" height={110} priority suffix="Admin" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#251b3a]">Admin &amp; Moderator</h1>
        <p className="mt-1 mb-5 text-sm text-[#5e5276]">
          শুধু আপনার ইমেইল দিন — পাসওয়ার্ড লাগবে না। ইমেইলে একটা login লিংক যাবে, সেটাতে চাপলেই ঢুকে যাবেন।
        </p>
        {sent ? (
          <div className="install-card" role="status">
            <p className="install-card-title"><Icon name="mark_email_read" size={22} /> ইমেইল চেক করুন</p>
            <p className="text-sm">{sent}</p>
            <p className="text-sm text-[#5e5276]">লিংকটা যেকোনো ফোন বা কম্পিউটারে খুললেই হবে। লিংক ১ ঘণ্টা কাজ করে।</p>
            <button type="button" className="public-back mt-2 mb-0" onClick={() => setSent(null)}>আবার পাঠান</button>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-semibold text-[#251b3a]">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="h-12 rounded-2xl border border-[#e4d8ff] bg-[#f8f4ff] px-4 text-base"
              />
            </label>
            <button type="submit" disabled={busy} className="public-action public-mint w-full">
              <Icon name="forward_to_inbox" size={22} /> {busy ? "পাঠানো হচ্ছে…" : "Login লিংক পাঠান"}
            </button>
            {error && <p className="text-sm text-[#a82144]" role="alert">{error}</p>}
          </form>
        )}
        <Link href="/" className="install-link mt-5">যাত্রী বা রাইডার? এখানে যান →</Link>
      </div>
    </main>
  );
}

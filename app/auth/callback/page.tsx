"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";

type Stage = "checking" | "set-password" | "email-linked" | "done" | "failed";

const OTP_TYPES: EmailOtpType[] = ["recovery", "email_change", "email", "signup", "magiclink", "invite"];

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [stage, setStage] = useState<Stage>("checking");
  const [message, setMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setStage("failed");
      setMessage("SheRides is not configured.");
      return;
    }
    const tokenHash = params.get("token_hash");
    const rawType = params.get("type") as EmailOtpType | null;
    const code = params.get("code");
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const isRecovery = rawType === "recovery" || params.get("next") === "reset" || /type=recovery/.test(hash);
    const errorDescription = params.get("error_description") || new URLSearchParams(hash.slice(1)).get("error_description");

    let cancelled = false;
    const finish = (ok: boolean, failText?: string) => {
      if (cancelled) return;
      if (!ok) {
        setStage("failed");
        setMessage(failText ?? "This link is invalid or has expired. Please request a new one.");
        return;
      }
      setStage(isRecovery ? "set-password" : "email-linked");
    };

    if (errorDescription) {
      finish(false, errorDescription.replace(/\+/g, " "));
      return;
    }

    void (async () => {
      if (tokenHash && rawType && OTP_TYPES.includes(rawType)) {
        // Link from our own email template: works even if opened in a different browser.
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: rawType });
        finish(!error, error?.message);
        return;
      }
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          // The browser client may already have exchanged it on load.
          const { data } = await supabase.auth.getSession();
          finish(Boolean(data.session), "Open the link on the same phone or browser where you asked for it, or request a new one.");
          return;
        }
        finish(true);
        return;
      }
      const { data } = await supabase.auth.getSession();
      finish(Boolean(data.session));
    })();

    return () => {
      cancelled = true;
    };
  }, [params]);

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (password.length < 6) return setMessage("Use at least 6 characters.");
    if (password !== confirm) return setMessage("The two passwords do not match.");
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMessage(error.message);
    setStage("done");
    window.setTimeout(() => router.replace("/home"), 1500);
  }

  const inputClass =
    "w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#6c5ce7] focus:ring-2 focus:ring-[#6c5ce7]/30";

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-10 bg-[#0b0b1a] text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <BrandLogo />
        </div>

        {stage === "checking" && (
          <p className="text-center text-white/80" role="status">
            Checking your link…
          </p>
        )}

        {stage === "set-password" && (
          <form onSubmit={(e) => void savePassword(e)} className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-center">Set a new password</h1>
            <p className="text-center text-white/70 text-sm">Choose a new password for your SheRides account.</p>
            <label className="sr-only" htmlFor="new-password">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className={inputClass} />
            <label className="sr-only" htmlFor="confirm-password">Confirm new password</label>
            <input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" className={inputClass} />
            <button type="submit" disabled={busy} className="h-12 rounded-xl bg-[#6c5ce7] font-semibold hover:bg-[#5a4bd4] transition-colors disabled:opacity-60">
              {busy ? "Saving…" : "Save new password"}
            </button>
            {message && <p className="text-sm text-[#ff8a8a]" role="alert">{message}</p>}
          </form>
        )}

        {stage === "email-linked" && (
          <div className="text-center flex flex-col gap-4">
            <Icon name="mark_email_read" size={44} className="mx-auto text-[#2ee6c5]" />
            <h1 className="text-2xl font-bold">Email verified</h1>
            <p className="text-white/75 text-sm">
              Your email is now linked. If you ever forget your password, type this email on the login page and tap
              <strong> Forgot password?</strong> — the reset link is free. You can still log in with your mobile number.
            </p>
            <Link href="/home" className="h-12 rounded-xl bg-[#6c5ce7] font-semibold grid place-items-center hover:bg-[#5a4bd4]">
              Go to SheRides
            </Link>
          </div>
        )}

        {stage === "done" && (
          <div className="text-center flex flex-col gap-3" role="status">
            <Icon name="check_circle" size={44} className="mx-auto text-[#2ee6c5]" />
            <h1 className="text-2xl font-bold">Password updated</h1>
            <p className="text-white/75 text-sm">Taking you to SheRides…</p>
          </div>
        )}

        {stage === "failed" && (
          <div className="text-center flex flex-col gap-4">
            <Icon name="link_off" size={44} className="mx-auto text-[#ff8a8a]" />
            <h1 className="text-2xl font-bold">Link not working</h1>
            <p className="text-white/75 text-sm" role="alert">{message}</p>
            <Link href="/login" className="h-12 rounded-xl bg-[#6c5ce7] font-semibold grid place-items-center hover:bg-[#5a4bd4]">
              Back to login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}

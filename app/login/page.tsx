"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/Icon";

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed")) return "আপনার ইমেইল ভেরিফাই করুন";
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "পাসওয়ার্ড ভুল হয়েছে";
  }
  return message;
}

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/home";
}

function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleForgotPassword() {
    setError(null);
    if (!email.trim()) {
      setResetMessage("প্রথমে আপনার ইমেইল লিখুন");
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: origin ? `${origin}/login` : undefined,
    });
    setResetMessage(
      resetError ? translateAuthError(resetError.message) : "রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে"
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-container-margin-mobile py-section-gap relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed-dim opacity-20 blur-[120px] rounded-full pointer-events-none" />
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-premium p-8 relative animate-fade-in-up">
        <Link href="/" className="block mb-6">
          <svg width="160" height="48" viewBox="0 0 320 96" xmlns="http://www.w3.org/2000/svg" aria-label="SheRides">
            <text x="10" y="72" fontFamily="Georgia, serif" fontSize="72" fontWeight="700" fill="#FF2D78" letterSpacing="-2">
              SheRides
            </text>
          </svg>
        </Link>
        <h1 className="font-headline-xl text-headline-xl mb-2">Sign in</h1>
        <p className="font-body-sm text-body-sm text-secondary mb-6">
          Welcome back to Bangladesh Women Riders Community.
        </p>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            setResetMessage(null);
            const message = await signIn(email, password);
            setBusy(false);
            if (message) setError(translateAuthError(message));
            else router.replace(next);
          }}
        >
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-accent-magenta transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <Icon name={showPassword ? "visibility_off" : "visibility"} size={20} />
            </button>
          </div>
          <div className="flex justify-end -mt-2">
            <button
              type="button"
              onClick={() => void handleForgotPassword()}
              className="font-body-sm text-body-sm text-accent-magenta hover:underline"
            >
              Forgot password?
            </button>
          </div>
          {resetMessage && <p className="font-body-sm text-accent-magenta">{resetMessage}</p>}
          {error && <p className="text-error font-body-sm">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="h-[56px] bg-accent-magenta text-white font-label-lg rounded-full shadow-magenta hover:bg-primary-container transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
          >
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="mt-6 font-body-sm text-secondary">
          New to SheRides?{" "}
          <Link
            href={email.trim() ? `/signup?email=${encodeURIComponent(email.trim())}` : "/signup"}
            className="text-accent-magenta font-label-lg"
          >
            Join Community
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { InteractivePanda, type PandaMood } from "@/components/auth/InteractivePanda";

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed")) return "Please verify your email first.";
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) return "The email or password is incorrect.";
  return message;
}

function safeUserNextPath(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/home";
  if (value === "/admin-login" || value.startsWith("/admin")) return "/home";
  return value;
}

export function LoginPanel({ admin = false }: { admin?: boolean }) {
  const { signIn } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = admin ? "/admin" : safeUserNextPath(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pandaMood, setPandaMood] = useState<PandaMood>("idle");

  async function handleForgotPassword() {
    setError(null);
    if (!email.trim()) {
      setResetMessage("Enter your email address first.");
      setPandaMood("sad");
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const resetPath = admin ? "/admin-login" : "/login";
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: origin ? `${origin}${resetPath}` : undefined,
    });
    setResetMessage(resetError ? translateAuthError(resetError.message) : "A password reset link has been sent to your email.");
    setPandaMood(resetError ? "sad" : "happy");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResetMessage(null);
    setPandaMood("hide");

    const message = await signIn(email.trim(), password);
    if (message) {
      setBusy(false);
      setError(translateAuthError(message));
      setPandaMood("sad");
      return;
    }

    if (admin) {
      const supabase = createClient();
      const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
      const { data: profile } = authData.user && supabase
        ? await supabase.from("profiles").select("role").eq("id", authData.user.id).maybeSingle()
        : { data: null };

      if (profile?.role !== "admin") {
        if (supabase) await supabase.auth.signOut();
        setBusy(false);
        setError("This account does not have administrator access.");
        setPandaMood("sad");
        return;
      }
    }

    setPandaMood("happy");
    window.setTimeout(() => {
      router.replace(next);
      router.refresh();
    }, 450);
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-container-margin-mobile py-section-gap relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed-dim opacity-20 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10 grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,448px)_1fr]">
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-premium p-8 relative animate-fade-in-up">
          <Link href="/" className="inline-block mb-6" aria-label="SheRides home">
            <BrandLogo suffix={admin ? "Admin" : undefined} className="text-[42px]" />
          </Link>
          <h1 className="font-headline-xl text-headline-xl mb-2">{admin ? "Admin Sign In" : "Sign in"}</h1>
          <p className="font-body-sm text-body-sm text-secondary mb-6">
            {admin ? "Restricted access for authorized SheRides administrators." : "Welcome back to Bangladesh Women Riders Community."}
          </p>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onFocus={() => setPandaMood("peek")}
              onBlur={() => !password && setPandaMood("idle")}
              onChange={(event) => { setEmail(event.target.value); setPandaMood("peek"); }}
              placeholder={admin ? "Admin email" : "Email"}
              className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onFocus={() => setPandaMood(showPassword ? "peek-password" : "hide")}
                onChange={(event) => { setPassword(event.target.value); setPandaMood(showPassword ? "peek-password" : "hide"); }}
                placeholder="Password"
                className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => {
                  const nextShow = !value;
                  setPandaMood(nextShow ? "peek-password" : "hide");
                  return nextShow;
                })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-accent-magenta transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Icon name={showPassword ? "visibility_off" : "visibility"} size={20} />
              </button>
            </div>
            <div className="flex justify-end -mt-2">
              <button type="button" onClick={() => void handleForgotPassword()} className="font-body-sm text-body-sm text-accent-magenta hover:underline">
                Forgot password?
              </button>
            </div>
            {resetMessage && <p className="font-body-sm text-accent-magenta">{resetMessage}</p>}
            {error && <p className="text-error font-body-sm" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="h-[56px] bg-accent-magenta text-white font-label-lg rounded-full shadow-magenta hover:bg-primary-container transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none">
              {busy ? "Signing in..." : admin ? "Sign In to Admin" : "Sign In"}
            </button>
          </form>
          {admin ? (
            <p className="mt-6 font-body-sm text-secondary">Community member? <Link href="/login" className="text-accent-magenta font-label-lg">User Sign In</Link></p>
          ) : (
            <p className="mt-6 font-body-sm text-secondary">New to SheRides?{" "}<Link href={email.trim() ? `/signup?email=${encodeURIComponent(email.trim())}` : "/signup"} className="text-accent-magenta font-label-lg">Join Community</Link></p>
          )}
        </div>
        <div className="hidden lg:flex min-h-[460px] items-center justify-center"><InteractivePanda mood={pandaMood} admin={admin} /></div>
        <div className="flex lg:hidden justify-center -mt-4 scale-75 origin-top h-[250px]"><InteractivePanda mood={pandaMood} admin={admin} /></div>
      </div>
    </div>
  );
}

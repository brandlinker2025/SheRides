"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/Icon";
import { AuthScene, authFieldClass } from "./AuthScene";
import { AuthOrDivider, AuthSocialButtons } from "./AuthSocialButtons";
import { usePandaForm } from "./usePandaForm";

const REMEMBER_KEY = "sherides-remember-email";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed")) return "Please verify your email first.";
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "The email or password is incorrect.";
  }
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
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const panda = usePandaForm();
  const emailValid = EMAIL_PATTERN.test(email.trim());

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  function persistRememberedEmail(nextEmail: string, remember: boolean) {
    try {
      if (remember && nextEmail) window.localStorage.setItem(REMEMBER_KEY, nextEmail);
      else window.localStorage.removeItem(REMEMBER_KEY);
    } catch {
      /* storage unavailable */
    }
  }

  async function handleForgotPassword() {
    setError(null);
    if (!email.trim()) {
      setResetMessage("Enter your email address first.");
      panda.onError();
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const resetPath = admin ? "/admin-login" : "/login";
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: origin ? `${origin}${resetPath}` : undefined,
    });
    setResetMessage(
      resetError ? translateAuthError(resetError.message) : "A password reset link has been sent to your email."
    );
    if (resetError) panda.onError();
    else panda.onSuccess();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResetMessage(null);

    const message = await signIn(email.trim(), password);
    if (message) {
      setBusy(false);
      setError(translateAuthError(message));
      panda.onError();
      return;
    }

    if (admin) {
      const supabase = createClient();
      const { data: authData } = supabase
        ? await supabase.auth.getUser()
        : { data: { user: null } };
      const { data: profile } = authData.user && supabase
        ? await supabase.from("profiles").select("role").eq("id", authData.user.id).maybeSingle()
        : { data: null };

      if (profile?.role !== "admin") {
        if (supabase) await supabase.auth.signOut();
        setBusy(false);
        setError("This account does not have administrator access.");
        panda.onError();
        return;
      }
    }

    persistRememberedEmail(email.trim(), rememberMe);
    panda.onSuccess();
    window.setTimeout(() => {
      router.replace(next);
      router.refresh();
    }, 900);
  }

  return (
    <AuthScene admin={admin} mood={panda.mood} track={panda.track}>
      <div className="w-full rounded-[28px] border border-[#FF2D78]/50 bg-[rgba(12,10,14,0.82)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,45,120,0.12)] backdrop-blur-xl sm:p-8">
        <h1
          className="mb-1 text-[34px] leading-none text-[#FF2D78] sm:text-[42px]"
          style={{ fontFamily: "var(--font-butterpop), Georgia, serif" }}
        >
          {admin ? "Admin Sign In" : "Welcome Back!"}
        </h1>
        <p className="mb-6 text-sm text-white/70">
          {admin
            ? "Restricted access for authorized SheRides administrators."
            : "Log in to your SheRides account"}
        </p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="relative block">
            <Icon name="mail" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                panda.onTextInput(event.target.value);
              }}
              onFocus={panda.onTextFocus}
              onBlur={panda.onBlur}
              placeholder={admin ? "Admin email" : "Email"}
              className={`${authFieldClass} pl-11 ${emailValid ? "pr-11" : ""}`}
            />
            {emailValid ? (
              <Icon
                name="check_circle"
                size={20}
                filled
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3ddc84]"
              />
            ) : null}
          </label>
          <label className="relative block">
            <Icon name="lock" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onFocus={() => panda.onPasswordFocus(showPassword)}
              onBlur={panda.onBlur}
              placeholder="Password"
              className={`${authFieldClass} pl-11 pr-12`}
            />
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setShowPassword((value) => {
                  const nextValue = !value;
                  panda.onPasswordVisibility(nextValue);
                  return nextValue;
                });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 transition-colors hover:text-[#FF2D78]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <Icon name={showPassword ? "visibility_off" : "visibility"} size={20} />
            </button>
          </label>
          <div className="flex items-center justify-between gap-3 -mt-1">
            <label className="inline-flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => {
                  const next = event.target.checked;
                  setRememberMe(next);
                  persistRememberedEmail(email.trim(), next);
                }}
                className="h-4 w-4 rounded border-white/30 bg-black/40 text-[#FF2D78] accent-[#FF2D78]"
              />
              Remember me
            </label>
            <button type="button" onClick={() => void handleForgotPassword()} className="text-sm text-[#FF2D78] hover:underline">
              Forgot password?
            </button>
          </div>
          {resetMessage && <p className="text-sm text-[#FF2D78]">{resetMessage}</p>}
          {error && (
            <p className="text-sm text-[#ff8a80]" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-[56px] items-center justify-center gap-2 rounded-full bg-[#FF2D78] font-label-lg text-white shadow-magenta transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e2165f] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
          >
            <Icon name="login" size={20} />
            {busy ? "Signing in..." : admin ? "Sign In to Admin" : "Sign In"}
          </button>
        </form>
        {!admin ? (
          <div className="mt-5 flex flex-col gap-4">
            <AuthOrDivider />
            <AuthSocialButtons
              onError={(message) => {
                setError(message);
                panda.onError();
              }}
            />
          </div>
        ) : null}
        {admin ? (
          <p className="mt-6 text-sm text-white/70">
            Community member?{" "}
            <Link href="/login" className="font-label-lg text-[#FF2D78]">
              User Sign In
            </Link>
          </p>
        ) : (
          <p className="mt-6 text-sm text-white/70">
            New to SheRides?{" "}
            <Link
              href={email.trim() ? `/signup?email=${encodeURIComponent(email.trim())}` : "/signup"}
              className="font-label-lg text-[#FF2D78]"
            >
              Join Community
            </Link>
          </p>
        )}
      </div>
    </AuthScene>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { isEmailIdentifier, normalizeBdPhone } from "@/lib/phone";
import { siteOrigin } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/Icon";
import { AuthScene, authFieldClass } from "./AuthScene";
import { DustumiSubmitButton } from "./DustumiSubmitButton";
import { PhoneOtpFields, postAuthJson } from "./PhoneOtpFields";
import { usePandaForm } from "./usePandaForm";

const REMEMBER_KEY = "sherides-remember-email";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function translateAuthError(message: string, member: boolean): string {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed")) {
    return member ? "Please verify your mobile number first." : "Please verify your email first.";
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return member ? "The mobile number or password is incorrect." : "The email or password is incorrect.";
  }
  return message;
}

function safeUserNextPath(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/home";
  if (value === "/admin-login" || value.startsWith("/admin")) return "/home";
  if (value === "/pending-approval") return "/home";
  return value;
}

export function LoginPanel({ admin = false }: { admin?: boolean }) {
  const { signIn } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = admin ? "/admin" : safeUserNextPath(params.get("next"));
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dodgeToken, setDodgeToken] = useState(0);
  const [resetStep, setResetStep] = useState<"idle" | "otp">("idle");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const panda = usePandaForm();
  const identifierValid = admin
    ? EMAIL_PATTERN.test(identifier.trim())
    : Boolean(normalizeBdPhone(identifier));

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_KEY);
      if (!saved) return;
      if (admin) {
        setIdentifier(saved);
        setRememberMe(true);
        return;
      }
      if (normalizeBdPhone(saved)) {
        setIdentifier(saved);
        setRememberMe(true);
      } else {
        window.localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      /* storage unavailable */
    }
  }, [admin]);

  function persistRememberedIdentifier(value: string, remember: boolean) {
    try {
      if (admin) {
        if (remember && value) window.localStorage.setItem(REMEMBER_KEY, value);
        else window.localStorage.removeItem(REMEMBER_KEY);
        return;
      }
      if (remember && normalizeBdPhone(value)) window.localStorage.setItem(REMEMBER_KEY, value);
      else window.localStorage.removeItem(REMEMBER_KEY);
    } catch {
      /* storage unavailable */
    }
  }

  function dodge() {
    setDodgeToken((value) => value + 1);
    panda.onError();
  }

  async function handleAdminForgotPassword() {
    setError(null);
    if (!identifier.trim()) {
      setResetMessage("Enter your email address first.");
      panda.onError();
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(identifier.trim(), {
      redirectTo: `${siteOrigin()}/admin-login`,
    });
    setResetMessage(
      resetError ? translateAuthError(resetError.message, false) : "A password reset link has been sent to your email."
    );
    if (resetError) panda.onError();
    else panda.onSuccess();
  }

  async function handleMemberForgotPassword() {
    setError(null);
    setResetMessage(null);
    if (!identifier.trim()) {
      setResetMessage("Enter your mobile number first.");
      panda.onError();
      return;
    }
    if (isEmailIdentifier(identifier)) {
      setResetMessage("Enter the mobile number on the account. Members reset with an SMS code, not email.");
      panda.onError();
      return;
    }
    const phone = normalizeBdPhone(identifier);
    if (!phone) {
      setResetMessage("Enter a valid Bangladesh mobile number first.");
      panda.onError();
      return;
    }
    setBusy(true);
    const message = await postAuthJson("/api/auth/otp/send", { phone, purpose: "reset" });
    setBusy(false);
    if (message) {
      setResetMessage(message);
      panda.onError();
      return;
    }
    setResetStep("otp");
    setResetMessage("We sent a verification code to your mobile.");
    panda.onSuccess();
  }

  async function handleResetWithOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const phone = normalizeBdPhone(identifier);
    if (!phone || !otpCode.trim() || !newPassword.trim()) {
      dodge();
      return;
    }
    if (newPassword.length < 6) {
      setError("Use at least 6 characters for your password.");
      panda.onError();
      return;
    }
    setBusy(true);
    const message = await postAuthJson("/api/auth/password", { phone, code: otpCode, password: newPassword });
    setBusy(false);
    if (message) {
      setError(message);
      panda.onError();
      return;
    }
    setResetStep("idle");
    setOtpCode("");
    setNewPassword("");
    setPassword(newPassword);
    setResetMessage("Password updated. Sign in with your mobile number.");
    panda.onSuccess();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResetMessage(null);

    if (admin) {
      setBusy(true);
      const message = await signIn(identifier.trim(), password);
      if (message) {
        setBusy(false);
        setError(translateAuthError(message, false));
        panda.onError();
        return;
      }
      const supabase = createClient();
      const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
      const { data: profile } =
        authData.user && supabase
          ? await supabase.from("profiles").select("role").eq("id", authData.user.id).maybeSingle()
          : { data: null };

      if (profile?.role !== "admin") {
        if (supabase) await supabase.auth.signOut();
        setBusy(false);
        setError("This account does not have administrator access.");
        panda.onError();
        return;
      }
      persistRememberedIdentifier(identifier.trim(), rememberMe);
      panda.onSuccess();
      window.setTimeout(() => {
        router.replace(next);
        router.refresh();
      }, 900);
      return;
    }

    if (!normalizeBdPhone(identifier) || !password.trim()) {
      dodge();
      return;
    }

    setBusy(true);
    const message = await signIn(identifier.trim(), password);
    if (message) {
      setBusy(false);
      setError(translateAuthError(message, true));
      panda.onError();
      return;
    }

    persistRememberedIdentifier(identifier.trim(), rememberMe);
    panda.onSuccess();
    window.setTimeout(() => {
      router.replace(next);
      router.refresh();
    }, 900);
  }

  const joinHref = normalizeBdPhone(identifier)
    ? `/signup?phone=${encodeURIComponent(identifier.trim())}`
    : "/signup";

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
          {admin ? "Restricted access for authorized SheRides administrators." : "Log in to your SheRides account"}
        </p>
        {resetStep === "otp" && !admin ? (
          <form className="flex flex-col gap-4" onSubmit={(event) => void handleResetWithOtp(event)} noValidate>
            <PhoneOtpFields
              code={otpCode}
              onCodeChange={setOtpCode}
              onFocus={panda.onTextFocus}
              onBlur={panda.onBlur}
            />
            <label className="relative block">
              <Icon name="lock" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                onFocus={() => panda.onPasswordFocus(showPassword)}
                onBlur={panda.onBlur}
                placeholder="New password"
                className={`${authFieldClass} pl-11 pr-12`}
              />
            </label>
            {error && (
              <p className="text-sm text-[#ff8a80]" role="alert">
                {error}
              </p>
            )}
            {resetMessage && <p className="text-sm text-[#FF2D78]">{resetMessage}</p>}
            <DustumiSubmitButton dodgeToken={dodgeToken} busy={busy}>
              {busy ? "Updating..." : "Set new password"}
            </DustumiSubmitButton>
            <button
              type="button"
              onClick={() => void handleMemberForgotPassword()}
              className="text-sm text-[#FF2D78] hover:underline"
            >
              Resend code
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)} noValidate={!admin}>
            <label className="block">
              <span className="mb-1.5 block text-sm text-white/70">{admin ? "Email" : "Mobile number"}</span>
              <span className="relative block">
                <Icon
                  name={admin ? "mail" : "smartphone"}
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
                />
                <input
                  type={admin ? "email" : "tel"}
                  required={admin}
                  name={admin ? "email" : "mobile"}
                  autoComplete={admin ? "email" : "tel"}
                  inputMode={admin ? "email" : "tel"}
                  value={identifier}
                  onChange={(event) => {
                    setIdentifier(event.target.value);
                    panda.onTextInput(event.target.value);
                  }}
                  onFocus={panda.onTextFocus}
                  onBlur={panda.onBlur}
                  placeholder={admin ? "Admin email" : "01XXXXXXXXX"}
                  className={`${authFieldClass} pl-11 ${identifierValid ? "pr-11" : ""}`}
                />
                {identifierValid ? (
                  <Icon
                    name="check_circle"
                    size={20}
                    filled
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3ddc84]"
                  />
                ) : null}
              </span>
            </label>
            <label className="relative block">
              <Icon name="lock" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
              <input
                type={showPassword ? "text" : "password"}
                required={admin}
                minLength={admin ? 6 : undefined}
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
                    const nextValue = event.target.checked;
                    setRememberMe(nextValue);
                    persistRememberedIdentifier(identifier.trim(), nextValue);
                  }}
                  className="h-4 w-4 rounded border-white/30 bg-black/40 text-[#FF2D78] accent-[#FF2D78]"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => void (admin ? handleAdminForgotPassword() : handleMemberForgotPassword())}
                className="text-sm text-[#FF2D78] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            {resetMessage && <p className="text-sm text-[#FF2D78]">{resetMessage}</p>}
            {error && (
              <p className="text-sm text-[#ff8a80]" role="alert">
                {error}
              </p>
            )}
            {admin ? (
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-[56px] items-center justify-center gap-2 rounded-full bg-[#FF2D78] font-label-lg text-white shadow-magenta transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e2165f] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
              >
                <Icon name="login" size={20} />
                {busy ? "Signing in..." : "Sign In to Admin"}
              </button>
            ) : (
              <DustumiSubmitButton dodgeToken={dodgeToken} busy={busy}>
                <Icon name="login" size={20} />
                {busy ? "Signing in..." : "Sign In"}
              </DustumiSubmitButton>
            )}
          </form>
        )}
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
            <Link href={joinHref} className="font-label-lg text-[#FF2D78]">
              Join Community
            </Link>
          </p>
        )}
      </div>
    </AuthScene>
  );
}

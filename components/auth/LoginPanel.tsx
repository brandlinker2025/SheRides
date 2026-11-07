"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { isEmailIdentifier, normalizeBdPhone } from "@/lib/phone";
import { siteOrigin } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/Icon";
import { AuthScene, authFieldClass } from "./AuthScene";
import { DustumiSubmitButton } from "./DustumiSubmitButton";
import { PhoneOtpFields, postAuthJson } from "./PhoneOtpFields";
import { usePandaForm } from "./usePandaForm";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function translateAuthError(message: string, member: boolean): string {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed")) {
    return member ? "Please confirm your account first." : "Please verify your email first.";
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return member ? "The mobile number or password is incorrect." : "The email or password is incorrect.";
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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dodgeToken, setDodgeToken] = useState(0);
  // SMS password reset (members who sign in with a mobile number).
  const [resetMode, setResetMode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const panda = usePandaForm();
  const identifierValid = admin
    ? EMAIL_PATTERN.test(identifier.trim())
    : Boolean(normalizeBdPhone(identifier)) || EMAIL_PATTERN.test(identifier.trim());

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
      setResetMessage("Enter your mobile number or email first.");
      panda.onError();
      return;
    }
    if (!isEmailIdentifier(identifier)) {
      if (!normalizeBdPhone(identifier)) {
        setResetMessage("Enter a valid mobile number (01XXXXXXXXX) or the email on your account.");
        panda.onError();
        return;
      }
      setResetMode(true);
      setCodeSent(false);
      setResetCode("");
      setNewPassword("");
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(identifier.trim(), {
      redirectTo: `${siteOrigin()}/login`,
    });
    setBusy(false);
    setResetMessage(
      resetError ? translateAuthError(resetError.message, true) : "A password reset link has been sent to your email."
    );
    if (resetError) panda.onError();
    else panda.onSuccess();
  }

  function friendlySmsError(message: string) {
    if (/not configured|not fully configured|cannot update passwords/i.test(message)) {
      return "SMS reset is not switched on yet. Please ask a SheRides admin to reset your password for you.";
    }
    return message;
  }

  async function sendResetCode() {
    setError(null);
    setResetMessage(null);
    setBusy(true);
    const message = await postAuthJson("/api/auth/otp/send", { phone: identifier.trim(), purpose: "reset" });
    setBusy(false);
    if (message) {
      setError(friendlySmsError(message));
      panda.onError();
      return;
    }
    setCodeSent(true);
    setResetMessage("We sent a 6-digit code to your mobile. It works for 10 minutes.");
  }

  async function submitNewPassword() {
    setError(null);
    setResetMessage(null);
    if (resetCode.length !== 6) {
      setError("Enter the 6-digit code from the SMS.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Use at least 6 characters for your new password.");
      return;
    }
    setBusy(true);
    const message = await postAuthJson("/api/auth/password", {
      phone: identifier.trim(),
      code: resetCode,
      password: newPassword,
    });
    if (message) {
      setBusy(false);
      setError(friendlySmsError(message));
      panda.onError();
      return;
    }
    const signInError = await signIn(identifier.trim(), newPassword);
    setBusy(false);
    if (signInError) {
      setResetMode(false);
      setPassword("");
      setResetMessage("Password changed. Please sign in with your new password.");
      return;
    }
    panda.onSuccess();
    window.setTimeout(() => {
      router.replace(next);
      router.refresh();
    }, 900);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resetMode) {
      void (codeSent ? submitNewPassword() : sendResetCode());
      return;
    }
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
      panda.onSuccess();
      window.setTimeout(() => {
        router.replace(next);
        router.refresh();
      }, 900);
      return;
    }

    if (!password.trim() || (!normalizeBdPhone(identifier) && !isEmailIdentifier(identifier))) {
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

    let dest = next;
    const supabase = createClient();
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("verified, role")
          .eq("id", authData.user.id)
          .maybeSingle();
        if (profile && profile.role !== "admin" && !profile.verified) dest = "/pending-approval";
      }
    }
    panda.onSuccess();
    window.setTimeout(() => {
      router.replace(dest);
      router.refresh();
    }, 900);
  }

  const joinHref = normalizeBdPhone(identifier)
    ? `/signup?phone=${encodeURIComponent(identifier.trim())}`
    : "/signup";

  return (
    <AuthScene admin={admin} mood={panda.mood} track={panda.track}>
      <div className="w-full rounded-[28px] border border-[#6c5ce7]/50 bg-[rgba(12,10,14,0.82)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35),0_0_0_1px_rgba(108,92,231,0.12)] backdrop-blur-xl sm:p-8">
        <h1
          className="mb-1 text-[34px] leading-none text-[#6c5ce7] sm:text-[42px]"
          style={{ fontFamily: "var(--font-butterpop), Georgia, serif" }}
        >
          {admin ? "Admin Sign In" : "Welcome Back!"}
        </h1>
        <p className="mb-6 text-sm text-white/70">
          {admin ? "Restricted access for authorized SheRides administrators." : "Log in to your SheRides account"}
        </p>
        <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)} noValidate={!admin}>
            <label className="block">
              <span className="mb-1.5 block text-sm text-white/70">{admin ? "Email" : "Mobile number or email"}</span>
              <span className="relative block">
                <Icon
                  name={admin ? "mail" : "smartphone"}
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
                />
                <input
                  type={admin ? "email" : "text"}
                  required={admin}
                  name={admin ? "email" : "mobile"}
                  autoComplete="off"
                  inputMode={admin ? "email" : "text"}
                  value={identifier}
                  onChange={(event) => {
                    setIdentifier(event.target.value);
                    panda.onTextInput(event.target.value);
                  }}
                  onFocus={panda.onTextFocus}
                  onBlur={panda.onBlur}
                  placeholder={admin ? "Admin email" : "01XXXXXXXXX or email"}
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
            {resetMode ? (
              <div className="flex flex-col gap-4 rounded-2xl border border-[#6c5ce7]/30 bg-black/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-label-lg text-white">Reset password with SMS</p>
                    <p className="text-xs text-white/60">A code will be sent to {identifier.trim() || "your mobile"}.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode(false);
                      setError(null);
                      setResetMessage(null);
                    }}
                    className="text-white/60 hover:text-white"
                    aria-label="Back to sign in"
                  >
                    <Icon name="close" size={20} />
                  </button>
                </div>
                {codeSent ? (
                  <>
                    <PhoneOtpFields code={resetCode} onCodeChange={setResetCode} disabled={busy} />
                    <label className="relative block">
                      <Icon name="lock_reset" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="New password (min 6 characters)"
                        className={`${authFieldClass} pl-11`}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void submitNewPassword()}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent-magenta text-white font-label-lg disabled:opacity-60"
                    >
                      <Icon name="key" size={20} />
                      {busy ? "Saving..." : "Save new password & sign in"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void sendResetCode()}
                      className="text-sm text-[#6c5ce7] hover:underline disabled:opacity-60"
                    >
                      Didn&apos;t get it? Send a new code
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={busy || !normalizeBdPhone(identifier)}
                    onClick={() => void sendResetCode()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent-magenta text-white font-label-lg disabled:opacity-60"
                  >
                    <Icon name="sms" size={20} />
                    {busy ? "Sending..." : "Send code by SMS"}
                  </button>
                )}
              </div>
            ) : null}
            <label className={`relative block ${resetMode ? "hidden" : ""}`}>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 transition-colors hover:text-[#6c5ce7]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Icon name={showPassword ? "visibility_off" : "visibility"} size={20} />
              </button>
            </label>
            <div className={`flex items-center justify-between gap-3 -mt-1 ${resetMode ? "hidden" : ""}`}>
              <label className="inline-flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => {
                    const nextValue = event.target.checked;
                    setRememberMe(nextValue);
                  }}
                  className="h-4 w-4 rounded border-white/30 bg-black/40 text-[#6c5ce7] accent-[#6c5ce7]"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => void (admin ? handleAdminForgotPassword() : handleMemberForgotPassword())}
                className="text-sm text-[#6c5ce7] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            {resetMessage && <p className="text-sm text-[#6c5ce7]">{resetMessage}</p>}
            {error && (
              <p className="text-sm text-[#ff8a80]" role="alert">
                {error}
              </p>
            )}
            {resetMode ? null : admin ? (
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-[56px] items-center justify-center gap-2 rounded-full bg-[#6c5ce7] font-label-lg text-white shadow-magenta transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5b4bdb] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
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
        {admin ? (
          <p className="mt-6 text-sm text-white/70">
            Community member?{" "}
            <Link href="/login" className="font-label-lg text-[#6c5ce7]">
              User Sign In
            </Link>
          </p>
        ) : (
          <p className="mt-6 text-sm text-white/70">
            New to SheRides?{" "}
            <Link href={joinHref} className="font-label-lg text-[#6c5ce7]">
              Sign Up / Join Community
            </Link>
          </p>
        )}
      </div>
    </AuthScene>
  );
}

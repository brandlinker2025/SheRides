"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { normalizeBdPhone } from "@/lib/phone";
import { Icon } from "@/components/ui/Icon";
import { AuthScene, authFieldClass } from "@/components/auth/AuthScene";
import { AuthOrDivider, AuthSocialButtons } from "@/components/auth/AuthSocialButtons";
import { DustumiSubmitButton } from "@/components/auth/DustumiSubmitButton";
import { PhoneOtpFields, postAuthJson } from "@/components/auth/PhoneOtpFields";
import { usePandaForm } from "@/components/auth/usePandaForm";

function SignupForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(() => params.get("phone") ?? params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dodgeToken, setDodgeToken] = useState(0);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  const panda = usePandaForm();

  function dodge() {
    setDodgeToken((value) => value + 1);
    panda.onError();
  }

  async function sendSignupOtp(normalized: string) {
    const message = await postAuthJson("/api/auth/otp/send", { phone: normalized, purpose: "signup" });
    if (message) {
      setError(message);
      panda.onError();
      return false;
    }
    setStep("otp");
    setInfo("We sent a verification code to your mobile.");
    panda.onSuccess();
    return true;
  }

  async function handleOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const normalized = normalizeBdPhone(phone);
    if (!normalized || !otpCode.trim()) {
      dodge();
      return;
    }
    setBusy(true);
    const message = await postAuthJson("/api/auth/otp/verify", {
      phone: normalized,
      code: otpCode,
      purpose: "signup",
    });
    setBusy(false);
    if (message) {
      setError(message);
      panda.onError();
      return;
    }
    panda.onSuccess();
    window.setTimeout(() => {
      router.replace("/home");
      router.refresh();
    }, 900);
  }

  return (
    <AuthScene
      mood={panda.mood}
      track={panda.track}
      speech={
        panda.mood === "idle" ? "Hey Rider! ♥ Create your account and join the ride!" : undefined
      }
    >
      <div className="w-full rounded-[28px] border border-[#FF2D78]/50 bg-[rgba(12,10,14,0.82)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,45,120,0.12)] backdrop-blur-xl sm:p-8">
        <h1
          className="mb-1 text-[34px] leading-none text-[#FF2D78] sm:text-[42px]"
          style={{ fontFamily: "var(--font-butterpop), Georgia, serif" }}
        >
          Join Community
        </h1>
        <p className="mb-6 text-sm text-white/70">
          {step === "otp"
            ? "Enter the code we sent to your mobile to verify your account."
            : "Create your account and start riding with the community."}
        </p>
        {step === "otp" ? (
          <form className="flex flex-col gap-4" onSubmit={(event) => void handleOtpSubmit(event)} noValidate>
            <PhoneOtpFields
              code={otpCode}
              onCodeChange={setOtpCode}
              onFocus={panda.onTextFocus}
              onBlur={panda.onBlur}
            />
            {error && (
              <p className="text-sm text-[#ff8a80]" role="alert">
                {error}
              </p>
            )}
            {info && <p className="text-sm text-[#FF2D78]">{info}</p>}
            <DustumiSubmitButton dodgeToken={dodgeToken} busy={busy}>
              {busy ? "Verifying..." : "Verify and join"}
            </DustumiSubmitButton>
            <button
              type="button"
              onClick={() => {
                const normalized = normalizeBdPhone(phone);
                if (normalized) void sendSignupOtp(normalized);
              }}
              className="text-sm text-[#FF2D78] hover:underline"
            >
              Resend code
            </button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setInfo(null);
              if (!phone.trim() || !password.trim()) {
                dodge();
                return;
              }
              const normalized = normalizeBdPhone(phone);
              if (!normalized) {
                setError("Enter a valid Bangladesh mobile number (01XXXXXXXXX or +8801XXXXXXXXX).");
                panda.onError();
                return;
              }
              if (password.length < 6) {
                setError("Use at least 6 characters for your password.");
                panda.onError();
                return;
              }
              if (password !== confirmPassword) {
                setError("Passwords do not match.");
                panda.onError();
                return;
              }
              setBusy(true);
              const message = await signUp(fullName.trim(), phone.trim(), password);
              if (message) {
                setBusy(false);
                setError(message);
                panda.onError();
                return;
              }
              setStep("otp");
              const sent = await sendSignupOtp(normalized);
              setBusy(false);
              if (!sent) return;
            }}
          >
            <label className="relative block">
              <Icon name="person" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
              <input
                minLength={2}
                maxLength={100}
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  panda.onTextInput(e.target.value);
                }}
                onFocus={panda.onTextFocus}
                onBlur={panda.onBlur}
                placeholder="Full name"
                className={`${authFieldClass} pl-11`}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-white/70">Mobile number</span>
              <span className="relative block">
                <Icon name="smartphone" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={16}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    panda.onTextInput(e.target.value);
                  }}
                  onFocus={panda.onTextFocus}
                  onBlur={panda.onBlur}
                  placeholder="01XXXXXXXXX"
                  className={`${authFieldClass} pl-11`}
                />
              </span>
            </label>
            <label className="relative block">
              <Icon name="lock" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
              <input
                type={showPassword ? "text" : "password"}
                maxLength={128}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => panda.onPasswordFocus(showPassword)}
                onBlur={panda.onBlur}
                placeholder="Password (min. 6 characters)"
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
            <input
              type={showPassword ? "text" : "password"}
              maxLength={128}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => panda.onPasswordFocus(showPassword)}
              onBlur={panda.onBlur}
              placeholder="Confirm password"
              className={authFieldClass}
            />
            {error && (
              <p className="text-sm text-[#ff8a80]" role="alert">
                {error}
              </p>
            )}
            {info && <p className="text-sm text-[#FF2D78]">{info}</p>}
            <DustumiSubmitButton dodgeToken={dodgeToken} busy={busy}>
              {busy ? "Creating account..." : "Join"}
            </DustumiSubmitButton>
          </form>
        )}
        {step === "form" ? (
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
        <p className="mt-6 text-sm text-white/70">
          Already a member?{" "}
          <Link href="/login" className="font-label-lg text-[#FF2D78]">
            Sign In
          </Link>
        </p>
      </div>
    </AuthScene>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

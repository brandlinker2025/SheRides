"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { normalizeBdPhone } from "@/lib/phone";
import { Icon } from "@/components/ui/Icon";
import { AuthScene, authFieldClass } from "@/components/auth/AuthScene";
import { DustumiSubmitButton } from "@/components/auth/DustumiSubmitButton";
import { usePandaForm } from "@/components/auth/usePandaForm";

function SignupForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(() => params.get("phone") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dodgeToken, setDodgeToken] = useState(0);
  const panda = usePandaForm();
  const identifierValid = Boolean(normalizeBdPhone(phone));

  function dodge() {
    setDodgeToken((value) => value + 1);
    panda.onError();
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
          Create your account with your mobile number. An administrator will approve you before you can ride.
        </p>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const normalized = normalizeBdPhone(phone);
            if (!normalized || !password.trim()) {
              dodge();
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
            panda.onSuccess();
            window.setTimeout(() => {
              router.replace("/pending-approval");
              router.refresh();
            }, 900);
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
          <DustumiSubmitButton dodgeToken={dodgeToken} busy={busy}>
            {busy ? "Creating account..." : "Join"}
          </DustumiSubmitButton>
        </form>
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

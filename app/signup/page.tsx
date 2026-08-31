"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/ui/Icon";
import { AuthScene, authFieldClass } from "@/components/auth/AuthScene";
import { AuthOrDivider, AuthSocialButtons } from "@/components/auth/AuthSocialButtons";
import { usePandaForm } from "@/components/auth/usePandaForm";

function SignupForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(() => params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const panda = usePandaForm();

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
          Create your account and start riding with the community.
        </p>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setInfo(null);
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
            const message = await signUp(fullName.trim(), email.trim(), password);
            setBusy(false);
            if (message?.toLowerCase().includes("check your email")) {
              setInfo("Check your email to confirm the account, then sign in to join the ride.");
              panda.onSuccess();
              return;
            }
            if (message) {
              setError(message);
              panda.onError();
              return;
            }
            panda.onSuccess();
            window.setTimeout(() => router.replace("/home"), 900);
          }}
        >
          <label className="relative block">
            <Icon name="person" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
            <input
              required
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
          <label className="relative block">
            <Icon name="mail" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
            <input
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                panda.onTextInput(e.target.value);
              }}
              onFocus={panda.onTextFocus}
              onBlur={panda.onBlur}
              placeholder="Email address"
              className={`${authFieldClass} pl-11`}
            />
          </label>
          <label className="relative block">
            <Icon name="lock" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
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
            required
            minLength={6}
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
          <button
            type="submit"
            disabled={busy}
            className="h-[56px] rounded-full bg-[#FF2D78] font-label-lg text-white shadow-magenta transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e2165f] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
          >
            {busy ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <div className="mt-5 flex flex-col gap-4">
          <AuthOrDivider />
          <AuthSocialButtons
            onError={(message) => {
              setError(message);
              panda.onError();
            }}
          />
        </div>
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

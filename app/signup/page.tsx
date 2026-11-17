"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { captainApplicationPath, captainPendingPath } from "@/lib/captain-onboarding";
import { useAuth } from "@/lib/auth-context";
import { dobInputBounds, validateDateOfBirth } from "@/lib/birthday";
import { parseMemberIdentifier } from "@/lib/phone";
import { Icon } from "@/components/ui/Icon";
import { AuthScene, authFieldClass } from "@/components/auth/AuthScene";
import { DustumiSubmitButton } from "@/components/auth/DustumiSubmitButton";
import { usePandaForm } from "@/components/auth/usePandaForm";

function SignupForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const captain = params.get("captain") === "1";
  const loginHref = captain ? `/login?next=${encodeURIComponent(captainApplicationPath)}` : "/login";
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState(() => params.get("phone") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dodgeToken, setDodgeToken] = useState(0);
  const panda = usePandaForm();
  const identifierValid = Boolean(parseMemberIdentifier(identifier));

  function dodge() {
    setDodgeToken((value) => value + 1);
    panda.onError();
  }

  return (
    <AuthScene>
      <div className="w-full">
        <h1 className="mb-1 text-2xl font-bold leading-tight text-white sm:text-3xl">Welcome to SheRides!</h1>
        <p className="mb-6 text-sm text-white/70">
          Create your account with your email or mobile number. An administrator will approve you before you can ride.
        </p>
        {confirmationRequired ? (
          <p className="rounded-xl bg-white/10 p-4 text-sm text-white/90" role="status">
            Check your inbox for the SheRides confirmation link. After opening it, you can sign in and wait for admin approval. You can add your date of birth from your profile after approval.
          </p>
        ) : <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            if (fullName.trim().length < 2) {
              setError("Enter your full name.");
              dodge();
              return;
            }
            if (!identifierValid) {
              setError("Enter a valid email address or Bangladesh mobile number.");
              dodge();
              return;
            }
            if (!password.trim()) {
              setError("Enter a password.");
              dodge();
              return;
            }
            const dobError = validateDateOfBirth(dateOfBirth);
            if (dobError) {
              setError(dobError);
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
            const result = await signUp(fullName.trim(), identifier, password, dateOfBirth);
            if (result.error) {
              setBusy(false);
              setError(result.error);
              panda.onError();
              return;
            }
            panda.onSuccess();
            if (result.confirmationRequired) {
              setConfirmationRequired(true);
              setBusy(false);
              return;
            }
            window.setTimeout(() => {
              router.replace(captain ? captainPendingPath : "/pending-approval");
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
              aria-label="Full name"
              className={`${authFieldClass} pl-11`}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-white/70">Email or mobile number</span>
            <span className="relative block">
              <Icon name="alternate_email" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
              <input
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={254}
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  panda.onTextInput(e.target.value);
                }}
                onFocus={panda.onTextFocus}
                onBlur={panda.onBlur}
                placeholder="Email or 01XXXXXXXXX"
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
          <label className="block">
            <span className="mb-1.5 block text-sm text-white/70">Date of birth</span>
            <span className="relative block">
              <Icon name="cake" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
              <input
                type="date"
                required
                value={dateOfBirth}
                min={dobInputBounds().min}
                max={dobInputBounds().max}
                onChange={(e) => setDateOfBirth(e.target.value)}
                onFocus={panda.onTextFocus}
                onBlur={panda.onBlur}
                className={`${authFieldClass} pl-11 [color-scheme:dark]`}
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
              placeholder="Password"
              aria-label="Password"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 transition-colors hover:text-[#dfc7ff]"
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
            aria-label="Confirm password"
            className={authFieldClass}
          />
          {error && (
            <p className="text-sm text-[#ff8a80]" role="alert">
              {error}
            </p>
          )}
          <DustumiSubmitButton dodgeToken={dodgeToken} busy={busy}>
            {busy ? "Creating account..." : "Sign Up"}
          </DustumiSubmitButton>
        </form>}
        <p className="mt-6 text-sm text-white/70">
          Already a member?{" "}
          <Link href={loginHref} className="font-label-lg text-[#dfc7ff]">
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

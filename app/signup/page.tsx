"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/ui/Icon";
import { BrandLogo } from "@/components/ui/BrandLogo";

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

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-container-margin-mobile py-section-gap relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed-dim opacity-20 blur-[120px] rounded-full pointer-events-none" />
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-premium p-8 relative animate-fade-in-up">
        <Link href="/" className="inline-block mb-6" aria-label="SheRides home">
          <BrandLogo className="text-[42px]" />
        </Link>
        <h1 className="font-headline-xl text-headline-xl mb-2">Join Community</h1>
        <p className="font-body-sm text-body-sm text-secondary mb-6">
          Create your account, complete rider verification, then wait for admin approval.
        </p>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setInfo(null);
            if (password.length < 10) {
              setError("Use at least 10 characters for your password.");
              return;
            }
            if (password !== confirmPassword) {
              setError("Passwords do not match.");
              return;
            }
            setBusy(true);
            const message = await signUp(fullName.trim(), email.trim(), password);
            setBusy(false);
            if (message?.toLowerCase().includes("check your email")) {
              setInfo("Check your email to confirm the account. Then sign in and complete rider verification for admin approval.");
              return;
            }
            if (message) {
              setError(message);
              return;
            }
            router.replace("/verification");
          }}
        >
          <input
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300"
          />
          <input
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 10 characters)"
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
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={10}
            maxLength={128}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300"
          />
          {error && <p className="text-error font-body-sm" role="alert">{error}</p>}
          {info && <p className="text-accent-magenta font-body-sm">{info}</p>}
          <button
            type="submit"
            disabled={busy}
            className="h-[56px] bg-accent-magenta text-white font-label-lg rounded-full shadow-magenta hover:bg-primary-container transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
          >
            {busy ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="mt-6 font-body-sm text-secondary">
          Already a member?{" "}
          <Link href="/login" className="text-accent-magenta font-label-lg">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

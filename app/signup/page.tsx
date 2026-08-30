"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/ui/Icon";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { InteractivePanda, type PandaMood } from "@/components/auth/InteractivePanda";

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
  const [pandaMood, setPandaMood] = useState<PandaMood>("idle");

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-container-margin-mobile py-section-gap relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed-dim opacity-20 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10 grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,448px)_1fr]">
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-premium p-8 relative animate-fade-in-up">
          <Link href="/" className="inline-block mb-6" aria-label="SheRides home">
            <BrandLogo className="text-[42px]" />
          </Link>
          <h1 className="font-headline-xl text-headline-xl mb-2">Join Community</h1>
          <p className="font-body-sm text-body-sm text-secondary mb-6">
            Built for verified female riders.
          </p>
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setInfo(null);

              if (password !== confirmPassword) {
                setError("Passwords do not match.");
                setPandaMood("sad");
                return;
              }

              setBusy(true);
              setPandaMood("hide");
              const message = await signUp(fullName, email, password);
              setBusy(false);

              if (message?.toLowerCase().includes("check your email")) {
                setInfo("আপনার ইমেইল চেক করুন এবং অ্যাকাউন্ট নিশ্চিত করুন, তারপর সাইন ইন করুন।");
                setPandaMood("happy");
                return;
              }

              if (message) {
                setError(message);
                setPandaMood("sad");
                return;
              }

              setPandaMood("happy");
              window.setTimeout(() => router.replace("/home"), 450);
            }}
          >
            <input
              required
              autoComplete="name"
              value={fullName}
              onFocus={() => setPandaMood("peek")}
              onChange={(e) => {
                setFullName(e.target.value);
                setPandaMood("peek");
              }}
              placeholder="Full name"
              className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300"
            />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onFocus={() => setPandaMood("peek")}
              onChange={(e) => {
                setEmail(e.target.value);
                setPandaMood("peek");
              }}
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
                onFocus={() => setPandaMood(showPassword ? "peek-password" : "hide")}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPandaMood(showPassword ? "peek-password" : "hide");
                }}
                placeholder="Password (min. 10 characters)"
                className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((v) => {
                    const next = !v;
                    setPandaMood(next ? "peek-password" : "hide");
                    return next;
                  })
                }
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
              onFocus={() => setPandaMood(showPassword ? "peek-password" : "hide")}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPandaMood(showPassword ? "peek-password" : "hide");
              }}
              placeholder="Confirm password"
              className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300"
            />
            {error && <p className="text-error font-body-sm">{error}</p>}
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

        <div className="hidden lg:flex min-h-[460px] items-center justify-center">
          <InteractivePanda mood={pandaMood} />
        </div>
        <div className="flex lg:hidden justify-center -mt-4 scale-75 origin-top h-[250px]">
          <InteractivePanda mood={pandaMood} />
        </div>
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

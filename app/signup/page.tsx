"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "@/components/ui/Icon";

function SignupForm() {
  const { signUp, user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const emailParam = params.get("email");
    if (emailParam) setEmail(emailParam);
  }, [params]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-container-margin-mobile py-section-gap relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed-dim opacity-20 blur-[120px] rounded-full pointer-events-none" />
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-premium p-8 relative animate-fade-in-up">
        <Link href="/" className="block mb-6">
          <span className="text-4xl font-bold text-accent-magenta" style={{ fontFamily: "cursive" }}>
            SheRides
          </span>
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
              setError("পাসওয়ার্ড মিলছে না");
              return;
            }
            setBusy(true);
            const message = await signUp(fullName, email, password);
            setBusy(false);
            if (message?.toLowerCase().includes("check your email")) {
              setInfo("আপনার ইমেইল চেক করুন এবং অ্যাকাউন্ট নিশ্চিত করুন, তারপর সাইন ইন করুন।");
              return;
            }
            if (message) {
              setError(message);
              return;
            }
            router.replace("/home");
          }}
        >
          <input
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="পূর্ণ নাম"
            className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300"
          />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ইমেইল"
            className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="পাসওয়ার্ড"
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
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="পাসওয়ার্ড নিশ্চিত করুন"
            className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta focus:ring-2 focus:ring-accent-magenta/20 transition-all duration-300"
          />
          {error && <p className="text-error font-body-sm">{error}</p>}
          {info && <p className="text-accent-magenta font-body-sm">{info}</p>}
          <button
            type="submit"
            disabled={busy}
            className="h-[56px] bg-accent-magenta text-white font-label-lg rounded-full shadow-magenta hover:bg-primary-container transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
          >
            {busy ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন"}
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

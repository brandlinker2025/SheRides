"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth-context";

function LoginForm() {
  const { signIn, continueAsDemo, demoMode } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/home";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = async (fn: () => Promise<string | null> | void) => {
    setBusy(true);
    setError(null);
    const message = await fn();
    setBusy(false);
    if (message) setError(message);
    else router.push(next);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-container-margin-mobile py-section-gap relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed-dim opacity-20 blur-[120px] rounded-full pointer-events-none" />
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-premium p-8 relative">
        <Link href="/" className="font-display-lg text-display-lg-mobile text-accent-magenta font-bold block mb-6">
          SheRides
        </Link>
        <h1 className="font-headline-xl text-headline-xl mb-2">Sign in</h1>
        <p className="font-body-sm text-body-sm text-secondary mb-6">
          Welcome back to Bangladesh Women Riders Community.
        </p>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void go(() => signIn(email, password));
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta"
          />
          {error && <p className="text-error font-body-sm">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="h-[56px] bg-accent-magenta text-white font-label-lg rounded-full shadow-magenta hover:bg-primary-container transition-colors"
          >
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            continueAsDemo();
            router.push(next);
          }}
          className="mt-4 w-full h-[56px] border-2 border-outline rounded-full font-label-lg hover:bg-soft-off-white"
        >
          {demoMode ? "Continue as Demo Rider" : "Preview with demo profile"}
        </button>
        <p className="mt-6 font-body-sm text-secondary">
          New to SheRides?{" "}
          <Link href="/signup" className="text-accent-magenta font-label-lg">
            Join Community
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

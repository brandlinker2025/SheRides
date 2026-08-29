"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const { signUp, continueAsDemo, demoMode } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-container-margin-mobile py-section-gap relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed-dim opacity-20 blur-[120px] rounded-full pointer-events-none" />
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-premium p-8 relative">
        <Link href="/" className="font-display-lg text-display-lg-mobile text-accent-magenta font-bold block mb-6">
          SheRides
        </Link>
        <h1 className="font-headline-xl text-headline-xl mb-2">Join Community</h1>
        <p className="font-body-sm text-body-sm text-secondary mb-6">
          Built for verified female riders.
        </p>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const message = await signUp(fullName, email, password);
            setBusy(false);
            if (message) setError(message);
            else router.push("/home");
          }}
        >
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta"
          />
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-soft-off-white border border-surface-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent-magenta"
          />
          {error && <p className="text-error font-body-sm">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="h-[56px] bg-accent-magenta text-white font-label-lg rounded-full shadow-magenta hover:bg-primary-container"
          >
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            continueAsDemo();
            router.push("/home");
          }}
          className="mt-4 w-full h-[56px] border-2 border-outline rounded-full font-label-lg hover:bg-soft-off-white"
        >
          {demoMode ? "Continue as Demo Rider" : "Preview with demo profile"}
        </button>
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

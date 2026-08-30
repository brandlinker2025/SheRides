"use client";

import { createClient } from "@/lib/supabase/client";
import { FacebookMark, GoogleMark } from "./auth-marks";

type AuthSocialButtonsProps = {
  onError: (message: string) => void;
  redirectTo?: string;
};

export function AuthSocialButtons({ onError, redirectTo }: AuthSocialButtonsProps) {
  async function startOAuth(provider: "google" | "facebook") {
    const supabase = createClient();
    if (!supabase) {
      onError("Sign-in is not configured yet.");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo ?? (origin ? `${origin}/home` : undefined),
      },
    });
    if (error) onError(error.message);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => void startOAuth("google")}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10"
      >
        <GoogleMark className="h-5 w-5" />
        Google
      </button>
      <button
        type="button"
        onClick={() => void startOAuth("facebook")}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10"
      >
        <FacebookMark className="h-5 w-5" />
        Facebook
      </button>
    </div>
  );
}

export function AuthOrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs tracking-[0.18em] text-white/45 uppercase">
      <span className="h-px flex-1 bg-white/15" />
      or
      <span className="h-px flex-1 bg-white/15" />
    </div>
  );
}

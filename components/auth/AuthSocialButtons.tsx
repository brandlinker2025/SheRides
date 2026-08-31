"use client";

import { useState } from "react";
import { siteOrigin } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";
import {
  isOAuthProviderEnabled,
  oauthUnavailableMessage,
  type OAuthProvider,
} from "@/lib/supabase/oauth-providers";
import { FacebookMark, GoogleMark } from "./auth-marks";

type AuthSocialButtonsProps = {
  onError: (message: string) => void;
  redirectTo?: string;
};

export function AuthSocialButtons({ onError, redirectTo }: AuthSocialButtonsProps) {
  const [busy, setBusy] = useState<OAuthProvider | null>(null);

  async function startOAuth(provider: OAuthProvider) {
    if (busy) return;
    setBusy(provider);
    const supabase = createClient();
    if (!supabase) {
      setBusy(null);
      onError("Sign-in is not configured yet.");
      return;
    }

    const enabled = await isOAuthProviderEnabled(provider);
    if (!enabled) {
      setBusy(null);
      onError(oauthUnavailableMessage(provider));
      return;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo ?? `${siteOrigin()}/home`,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      setBusy(null);
      onError(error?.message || oauthUnavailableMessage(provider));
      return;
    }

    window.location.assign(data.url);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => void startOAuth("google")}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10 disabled:opacity-60"
      >
        <GoogleMark className="h-5 w-5" />
        {busy === "google" ? "Checking…" : "Google"}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => void startOAuth("facebook")}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10 disabled:opacity-60"
      >
        <FacebookMark className="h-5 w-5" />
        {busy === "facebook" ? "Checking…" : "Facebook"}
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

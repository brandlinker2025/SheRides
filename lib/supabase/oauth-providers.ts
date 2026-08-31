import { isSupabaseConfigured } from "./config";

export type OAuthProvider = "google" | "facebook";

type GoTrueSettings = {
  external?: Partial<Record<OAuthProvider, boolean>>;
};

export function oauthProviderLabel(provider: OAuthProvider) {
  return provider === "google" ? "Google" : "Facebook";
}

export function oauthUnavailableMessage(provider: OAuthProvider) {
  return `${oauthProviderLabel(provider)} sign-in isn’t available yet. Please use your email and password.`;
}

export async function isOAuthProviderEnabled(provider: OAuthProvider): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });
    if (!response.ok) return false;
    const settings = (await response.json()) as GoTrueSettings;
    return settings.external?.[provider] === true;
  } catch {
    return false;
  }
}

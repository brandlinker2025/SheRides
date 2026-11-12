import type { Rider } from "./types";
import { formatBike } from "./bikes";

const TESTER_RE = /tester/i;
const SEED_FLAG_KEYS = ["is_seed", "is_tester", "seed", "seed_account"] as const;

/** Sector seed accounts from supabase/seed.sql — hidden from member discovery, not deleted. */
export const SEED_TESTER_IDS = new Set([
  "a1111111-1111-4111-8111-111111111112",
  "a1111111-1111-4111-8111-111111111113",
  "a1111111-1111-4111-8111-111111111114",
  "a1111111-1111-4111-8111-111111111115",
]);

function isTruthyFlag(value: unknown) {
  return value === true || value === 1 || value === "true" || value === "1";
}

type DiscoveryAccount = {
  id?: unknown;
  username?: unknown;
  fullName?: unknown;
  full_name?: unknown;
  is_seed?: unknown;
  is_tester?: unknown;
  seed?: unknown;
  seed_account?: unknown;
};

/** Hide seed/tester accounts from member-facing people lists. Does not delete data. */
export function isSeedOrTesterAccount(account: DiscoveryAccount | null | undefined): boolean {
  if (!account) return false;
  const id = account.id != null ? String(account.id) : "";
  if (id && SEED_TESTER_IDS.has(id)) return true;
  if (TESTER_RE.test(String(account.username ?? ""))) return true;
  if (TESTER_RE.test(String(account.fullName ?? account.full_name ?? ""))) return true;
  return SEED_FLAG_KEYS.some((key) => isTruthyFlag(account[key]));
}

export function initialsFromName(name?: string | null) {
  const parts = (name || "Rider").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "R") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function isApprovedProfile(profile: { verified?: boolean | null; role?: string | null } | null | undefined) {
  return profile?.role === "admin" || profile?.verified === true;
}

export function riderFromProfile(
  id: string,
  data: Record<string, unknown> | null,
  fallbackName?: string
): Rider {
  const fullName = (data?.full_name as string) || fallbackName || "Rider";
  const brand = (data?.bike_brand as string) || "";
  const model = (data?.bike_model as string) || "";
  return {
    id,
    username: (data?.username as string) || "",
    fullName,
    bio: (data?.bio as string) || "",
    location: (data?.location as string) || "",
    bike: formatBike(brand, model, data?.bike as string),
    bikeBrand: brand,
    bikeModel: model,
    avatar: (data?.avatar_url as string) || "",
    cover: (data?.cover_url as string) || "",
    verified: Boolean(data?.verified),
    role: data?.role === "admin" ? "admin" : "rider",
    hasBirthday: Boolean(data?.hasBirthday ?? data?.has_birthday),
  };
}

export function formatRelativeTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

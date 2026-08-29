import type { Rider } from "./types";
import { formatBike } from "./bikes";

export function initialsFromName(name?: string | null) {
  const parts = (name || "Rider").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "R") + (parts[1]?.[0] ?? "")).toUpperCase();
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
    followers: (data?.followers_count as number) ?? 0,
    following: (data?.following_count as number) ?? 0,
    postsCount: (data?.posts_count as number) ?? 0,
    ridesCount: (data?.rides_count as number) ?? 0,
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

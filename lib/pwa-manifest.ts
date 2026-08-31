import type { MetadataRoute } from "next";
import { SITE_URL } from "./site";

const icons: NonNullable<MetadataRoute.Manifest["icons"]> = [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
  { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
];

const shared = {
  background_color: "#fff3ea",
  theme_color: "#E91E63",
  display: "standalone" as const,
  display_override: ["standalone", "minimal-ui"] as NonNullable<MetadataRoute.Manifest["display_override"]>,
  lang: "en",
  dir: "ltr" as const,
  scope: "/",
  icons,
  prefer_related_applications: false,
  categories: ["social", "lifestyle"],
};

export function communityManifest(): MetadataRoute.Manifest {
  return {
    ...shared,
    id: "/home",
    name: "SheRides",
    short_name: "SheRides",
    description: "Bangladesh Women Riders Community",
    start_url: "/home",
  };
}

export function adminManifest(): MetadataRoute.Manifest {
  return {
    ...shared,
    id: "/admin",
    name: "SheRides Admin",
    short_name: "SR Admin",
    description: "SheRides admin dashboard",
    start_url: "/admin",
    related_applications: [{ platform: "webapp", url: `${SITE_URL}/manifest.webmanifest` }],
  };
}

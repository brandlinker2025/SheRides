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
  background_color: "#0f1024",
  theme_color: "#6c5ce7",
  display: "standalone" as const,
  display_override: ["standalone", "minimal-ui"] as NonNullable<MetadataRoute.Manifest["display_override"]>,
  lang: "en",
  dir: "ltr" as const,
  scope: "/",
  icons,
  prefer_related_applications: false,
  categories: ["travel", "navigation"],
};

export function riderAppManifest(): MetadataRoute.Manifest {
  return {
    ...shared,
    // Keep the original id so phones that already installed SheRides update in place.
    id: "/home",
    name: "SheRides",
    short_name: "SheRides",
    description: "Women-only ride sharing in Bangladesh",
    start_url: "/go",
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

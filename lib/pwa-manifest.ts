import type { MetadataRoute } from "next";
import { brandAssetPath } from "./brand-assets";
import { SITE_URL } from "./site";

const icons: NonNullable<MetadataRoute.Manifest["icons"]> = [
  { src: `${brandAssetPath}/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
  { src: `${brandAssetPath}/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
  { src: `${brandAssetPath}/icon-192-maskable.png`, sizes: "192x192", type: "image/png", purpose: "maskable" },
  { src: `${brandAssetPath}/icon-512-maskable.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
];

const shared = {
  background_color: "#1B1324",
  theme_color: "#460377",
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

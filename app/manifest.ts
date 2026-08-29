import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SheRides",
    short_name: "SheRides",
    description: "Bangladesh Women Riders Community",
    start_url: "/home",
    display: "standalone",
    background_color: "#f9f9f9",
    theme_color: "#E91E63",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}

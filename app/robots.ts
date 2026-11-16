import type { MetadataRoute } from "next";

const siteUrl = "https://sherides.online";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/ride-map"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";

const siteUrl = "https://sherides.online";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  ];
}

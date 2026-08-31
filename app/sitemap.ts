import type { MetadataRoute } from "next";

const siteUrl = "https://sherides.online";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/download`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteUrl}/signup`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
  ];
}

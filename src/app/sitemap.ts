import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  if (!siteUrl) return [];

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/library`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/founder`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/legal`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
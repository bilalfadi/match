import { MetadataRoute } from "next";
import { getAllPostSlugsWithDates } from "@/lib/data/posts";
import { getBaseUrl } from "@/lib/env";

const BASE = getBaseUrl();

const STATIC_PAGES: { url: string; changeFrequency?: "daily" | "weekly" | "monthly"; priority?: number }[] = [
  { url: "/", changeFrequency: "daily", priority: 1 },
  { url: "/news", changeFrequency: "daily", priority: 0.9 },
  { url: "/football", changeFrequency: "daily", priority: 0.9 },
  { url: "/premier-league", changeFrequency: "daily", priority: 0.9 },
  { url: "/schedule", changeFrequency: "daily", priority: 0.8 },
  { url: "/about", changeFrequency: "monthly", priority: 0.5 },
  { url: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { url: "/privacy", changeFrequency: "monthly", priority: 0.3 },
  { url: "/terms", changeFrequency: "monthly", priority: 0.3 },
  { url: "/cookies", changeFrequency: "monthly", priority: 0.3 },
  { url: "/ccpa", changeFrequency: "monthly", priority: 0.3 },
  { url: "/disclaimer", changeFrequency: "monthly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllPostSlugsWithDates();
  const postEntries: MetadataRoute.Sitemap = slugs.map(({ slug, updatedAt }) => ({
    url: `${BASE}/${slug}`,
    lastModified: updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${BASE}${p.url}`,
    lastModified: new Date().toISOString(),
    changeFrequency: p.changeFrequency ?? "weekly",
    priority: p.priority ?? 0.6,
  }));
  return [...staticEntries, ...postEntries];
}

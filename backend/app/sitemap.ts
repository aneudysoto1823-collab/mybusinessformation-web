import type { MetadataRoute } from "next";
import { listArticles, type Section, type Lang } from "@/lib/content";
import { articleUrl, sectionHubUrl } from "@/lib/cross-links";

const BASE_URL = "https://mybusinessformation.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/new-business`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/new-business/es`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/servicios`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // ── Hubs de /wiki y /guias (siempre, aunque estén vacíos hoy) ────────────
  const hubs: MetadataRoute.Sitemap = (['wiki', 'guias'] as Section[]).flatMap((section) =>
    (['en', 'es'] as Lang[]).map((lang) => ({
      url: `${BASE_URL}${sectionHubUrl(section, lang)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  );

  // ── Artículos individuales de /wiki y /guias (auto) ──────────────────────
  // Se actualizan automáticamente cuando se suben .md a backend/content/.
  const articlePages: MetadataRoute.Sitemap = (['wiki', 'guias'] as Section[]).flatMap((section) =>
    (['en', 'es'] as Lang[]).flatMap((lang) =>
      listArticles(section, lang).map((a) => ({
        url: `${BASE_URL}${articleUrl(section, lang, a.slug)}`,
        lastModified: a.lastUpdated ? new Date(a.lastUpdated) : new Date(a.date),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }))
    )
  );

  return [...staticPages, ...hubs, ...articlePages];
}

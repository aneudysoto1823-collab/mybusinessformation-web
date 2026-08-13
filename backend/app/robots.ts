import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host') || '';
  const isFBFC = host.includes('mybusinessformation.com');
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/client-portal/dashboard"],
      },
    ],
    sitemap: isFBFC ? "https://mybusinessformation.com/sitemap.xml" : "https://opabiz.com/sitemap.xml",
  };
}

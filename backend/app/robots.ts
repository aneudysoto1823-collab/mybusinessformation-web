import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/client-portal/dashboard"],
      },
    ],
    sitemap: "https://opabiz.com/sitemap.xml",
  };
}

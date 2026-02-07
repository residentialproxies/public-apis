import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/api/",
          "/category/",
          "/about",
          "/bot",
          "/catalog",
          "/privacy",
          "/terms",
          "/trust",
          "/screenshots/",
          "/en/",
          "/zh/",
          "/ja/",
          "/es/",
          "/pt-BR/",
          "/de/",
          "/zh/privacy",
          "/ja/privacy",
          "/es/privacy",
          "/pt-BR/privacy",
          "/de/privacy",
          "/zh/terms",
          "/ja/terms",
          "/es/terms",
          "/pt-BR/terms",
          "/de/terms",
          "/zh/trust",
          "/ja/trust",
          "/es/trust",
          "/pt-BR/trust",
          "/de/trust",
        ],
        disallow: [
          "/_next/",
          "/_next/static/",
          "/api/*/health",
          "/search",
          "/en/search",
          "/zh/search",
          "/ja/search",
          "/es/search",
          "/pt-BR/search",
          "/de/search",
          "/admin/",
          "/*.json$",
          "/api/v1/",
        ],
        crawlDelay: 1,
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/screenshots/", "/opengraph-image"],
        disallow: ["/_next/", "/admin/", "/api/v1/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/screenshots/", "/opengraph-image"],
        disallow: ["/_next/static/"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/", "/screenshots/"],
        disallow: ["/_next/", "/admin/", "/api/v1/"],
        crawlDelay: 2,
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/admin/", "/api/v1/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/admin/", "/api/v1/"],
      },
      {
        userAgent: "Claude-Web",
        allow: "/",
        disallow: ["/admin/", "/api/v1/"],
      },
      {
        userAgent: "Anthropic-AI",
        allow: "/",
        disallow: ["/admin/", "/api/v1/"],
      },
      {
        userAgent: "AhrefsBot",
        crawlDelay: 10,
      },
      {
        userAgent: "SemrushBot",
        crawlDelay: 10,
      },
    ],
    sitemap: [
      `${siteUrl}/sitemap-index.xml`,
      `${siteUrl}/sitemap.xml`,
      `${siteUrl}/sitemap-images.xml`,
    ],
    host: siteUrl,
  };
}

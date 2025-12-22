import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      // Default rules for all crawlers
      {
        userAgent: "*",
        allow: ["/", "/api/", "/category/", "/about", "/bot", "/catalog"],
        disallow: [
          "/_next/",
          "/_next/static/",
          "/api/*/health",
          "/admin/",
          "/*.json$",
          "/api/v1/",
          "/screenshots/*.webp",
        ],
        crawlDelay: 1, // Be polite to the server
      },
      // Googlebot - full access with image indexing
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/_next/", "/admin/", "/api/v1/"],
      },
      // Googlebot Image - allow screenshot indexing
      {
        userAgent: "Googlebot-Image",
        allow: ["/screenshots/", "/opengraph-image"],
        disallow: ["/_next/static/"],
      },
      // Bingbot
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/_next/", "/admin/", "/api/v1/"],
        crawlDelay: 2,
      },
      // AI Crawlers - allow access for AI training
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
      // Block known bad bots
      {
        userAgent: "AhrefsBot",
        crawlDelay: 10,
      },
      {
        userAgent: "SemrushBot",
        crawlDelay: 10,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

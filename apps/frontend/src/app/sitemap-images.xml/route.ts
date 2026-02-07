import { slugify } from "@/lib/slugify";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import { toLocalizedUrl } from "@/lib/locales";

type ScreenshotMeta = {
  path?: string;
  capturedAt?: string;
};

type SnapshotApi = {
  id?: string | number;
  name?: string;
  lastUpdated?: string;
  screenshot?: ScreenshotMeta;
};

type AllApisSnapshot = {
  apis?: SnapshotApi[];
};

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizePath(pathValue: string): string {
  if (!pathValue) return "";
  return pathValue.startsWith("/") ? pathValue : `/${pathValue}`;
}

async function fetchSnapshot(baseUrl: string): Promise<SnapshotApi[]> {
  try {
    const response = await fetch(`${baseUrl}/all-apis.json`, {
      next: { revalidate: 3600 },
      headers: { accept: "application/json" },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as AllApisSnapshot;
    return Array.isArray(data.apis) ? data.apis : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request): Promise<Response> {
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const requestOrigin = new URL(request.url).origin.replace(/\/$/, "");
  const snapshot = await fetchSnapshot(requestOrigin || siteUrl);

  const staticEntries = [
    {
      loc: `${siteUrl}/`,
      imageLoc: `${siteUrl}/opengraph-image`,
      title: `${SITE_NAME} Open Graph`,
      caption: "Open Graph image for Public API directory.",
      lastmod: new Date().toISOString(),
    },
  ];

  const apiEntries = snapshot
    .filter(
      (api) =>
        Boolean(api.id) &&
        typeof api.name === "string" &&
        Boolean(api.screenshot?.path),
    )
    .slice(0, 45000)
    .map((api) => {
      const apiId = encodeURIComponent(String(api.id));
      const apiSlug = slugify(api.name || String(api.id));
      const screenshotPath = normalizePath(api.screenshot?.path || "");
      const screenshotUrl = `${siteUrl}${screenshotPath}`;
      const detailPath = `/api/${apiId}/${apiSlug}`;

      return {
        loc: toLocalizedUrl(siteUrl, detailPath, "en"),
        imageLoc: screenshotUrl,
        title: `${api.name} API documentation screenshot`,
        caption: `Screenshot preview of ${api.name} API documentation.`,
        lastmod:
          api.screenshot?.capturedAt ||
          api.lastUpdated ||
          new Date().toISOString(),
      };
    });

  const entries = [...staticEntries, ...apiEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>
    <image:image>
      <image:loc>${escapeXml(entry.imageLoc)}</image:loc>
      <image:title>${escapeXml(entry.title)}</image:title>
      <image:caption>${escapeXml(entry.caption)}</image:caption>
    </image:image>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}

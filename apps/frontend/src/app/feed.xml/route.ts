import { fetchApisList } from "@/lib/backend";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { slugify } from "@/lib/slugify";

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(): Promise<Response> {
  const siteUrl = getSiteUrl();

  const apiList = await fetchApisList({
    limit: "100",
    sort: "-lastCheckedAt",
  }).catch(() => ({ docs: [] }));

  const nowUtc = new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${nowUtc}</lastBuildDate>
    <atom:link href="${escapeXml(siteUrl)}/feed.xml" rel="self" type="application/rss+xml"/>
    <generator>Next.js</generator>
    ${apiList.docs
      .slice(0, 50)
      .map((api) => {
        const path = `/api/${api.id}/${slugify(api.name)}`;
        const url = `${siteUrl}${path}`;
        const pubDate = new Date(api.lastCheckedAt ?? Date.now()).toUTCString();

        return `<item>
      <title>${escapeXml(api.name)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(api.description)}</description>
      <category>${escapeXml(api.category?.name ?? "General")}</category>
      <pubDate>${pubDate}</pubDate>
    </item>`;
      })
      .join("\n")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}

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

  const updatedAt = new Date().toISOString();

  const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(SITE_NAME)}</title>
  <subtitle>${escapeXml(SITE_DESCRIPTION)}</subtitle>
  <link href="${escapeXml(siteUrl)}"/>
  <link href="${escapeXml(siteUrl)}/feed.atom" rel="self"/>
  <updated>${updatedAt}</updated>
  <id>${escapeXml(siteUrl)}/</id>
  <generator>Next.js</generator>
  ${apiList.docs
    .slice(0, 50)
    .map((api) => {
      const path = `/api/${api.id}/${slugify(api.name)}`;
      const url = `${siteUrl}${path}`;
      const entryUpdated = new Date(api.lastCheckedAt ?? Date.now()).toISOString();

      return `<entry>
    <title>${escapeXml(api.name)}</title>
    <link href="${escapeXml(url)}"/>
    <id>${escapeXml(url)}</id>
    <updated>${entryUpdated}</updated>
    <summary>${escapeXml(api.description)}</summary>
    <category term="${escapeXml(api.category?.slug ?? "general")}" />
  </entry>`;
    })
    .join("\n")}
</feed>`;

  return new Response(atom, {
    headers: {
      "content-type": "application/atom+xml; charset=utf-8",
      "cache-control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}

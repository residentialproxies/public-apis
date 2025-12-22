"use client";

import { useEffect, useState } from "react";

interface SeoData {
  title?: string;
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  favicon?: string;
}

interface ContentData {
  h1?: string;
  h2s?: string[];
  languages?: string[];
  hasCodeExamples?: boolean;
  docQualityScore?: number;
}

interface ApiEnrichedData {
  seo?: SeoData;
  content?: ContentData;
}

interface Props {
  apiLink: string; // Use link to match
}

export function SeoMetadata({ apiLink }: Props) {
  const [data, setData] = useState<ApiEnrichedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/all-apis.json");
        const allData = await res.json();
        const api = allData.apis.find((a: any) => a.link === apiLink);

        if (api) {
          setData({
            seo: api.seo,
            content: api.content,
          });
        }
      } catch (error) {
        console.error("Failed to load API data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [apiLink]);

  if (loading) {
    return (
      <div className="ui-surface mt-6 p-6">
        <h2 className="text-sm font-semibold text-zinc-900">
          SEO & Content Analysis
        </h2>
        <p className="mt-3 text-sm text-zinc-600">Loading...</p>
      </div>
    );
  }

  if (!data?.seo && !data?.content) {
    return null;
  }

  return (
    <section className="ui-surface mt-6 p-6">
      <h2 className="text-sm font-semibold text-zinc-900">
        SEO & Content Analysis
      </h2>

      {/* Page Title & Description */}
      {data.seo && (data.seo.title || data.seo.description) ? (
        <div className="mt-4 space-y-3">
          {data.seo.title ? (
            <div>
              <div className="text-xs font-medium text-zinc-500">
                Page Title
              </div>
              <div className="mt-1 text-sm text-zinc-900">{data.seo.title}</div>
            </div>
          ) : null}

          {data.seo.description ? (
            <div>
              <div className="text-xs font-medium text-zinc-500">
                Meta Description
              </div>
              <div className="mt-1 text-sm text-zinc-700">
                {data.seo.description}
              </div>
            </div>
          ) : null}

          {data.seo.keywords && data.seo.keywords.length > 0 ? (
            <div>
              <div className="text-xs font-medium text-zinc-500">Keywords</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {data.seo.keywords.map((keyword, i) => (
                  <span key={i} className="ui-chip text-xs">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Content Analysis */}
      {data.content ? (
        <div className="mt-6 space-y-3 border-t border-zinc-200 pt-4">
          <h3 className="text-xs font-semibold text-zinc-900">
            Content Analysis
          </h3>

          {data.content.h1 ? (
            <div>
              <div className="text-xs font-medium text-zinc-500">
                Main Heading (H1)
              </div>
              <div className="mt-1 text-sm text-zinc-900">
                {data.content.h1}
              </div>
            </div>
          ) : null}

          {data.content.h2s && data.content.h2s.length > 0 ? (
            <div>
              <div className="text-xs font-medium text-zinc-500">
                Section Headings (H2)
              </div>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {data.content.h2s.slice(0, 5).map((h2, i) => (
                  <li key={i}>{h2}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.content.languages && data.content.languages.length > 0 ? (
            <div>
              <div className="text-xs font-medium text-zinc-500">
                Programming Languages Detected
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {data.content.languages.map((lang, i) => (
                  <span
                    key={i}
                    className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-900"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            {data.content.hasCodeExamples !== undefined ? (
              <div>
                <div className="text-xs font-medium text-zinc-500">
                  Code Examples
                </div>
                <div className="mt-1 text-sm font-medium text-zinc-900">
                  {data.content.hasCodeExamples ? "✅ Yes" : "❌ No"}
                </div>
              </div>
            ) : null}

            {data.content.docQualityScore ? (
              <div>
                <div className="text-xs font-medium text-zinc-500">
                  Doc Quality Score
                </div>
                <div className="mt-1 text-sm font-medium text-zinc-900">
                  {data.content.docQualityScore}/10
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Open Graph */}
      {data.seo &&
      (data.seo.ogTitle || data.seo.ogDescription || data.seo.ogImage) ? (
        <div className="mt-6 space-y-3 border-t border-zinc-200 pt-4">
          <h3 className="text-xs font-semibold text-zinc-900">Open Graph</h3>

          {data.seo.ogTitle ? (
            <div>
              <div className="text-xs font-medium text-zinc-500">OG Title</div>
              <div className="mt-1 text-sm text-zinc-900">
                {data.seo.ogTitle}
              </div>
            </div>
          ) : null}

          {data.seo.ogDescription ? (
            <div>
              <div className="text-xs font-medium text-zinc-500">
                OG Description
              </div>
              <div className="mt-1 text-sm text-zinc-700">
                {data.seo.ogDescription}
              </div>
            </div>
          ) : null}

          {data.seo.ogImage ? (
            <div>
              <div className="text-xs font-medium text-zinc-500">OG Image</div>
              <img
                src={data.seo.ogImage}
                alt="Open Graph preview"
                className="mt-1 max-h-40 rounded border border-zinc-200"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="mt-4 text-xs text-zinc-500">
        SEO data extracted from the API documentation page via Cloudflare
        Browser Rendering.
      </p>
    </section>
  );
}

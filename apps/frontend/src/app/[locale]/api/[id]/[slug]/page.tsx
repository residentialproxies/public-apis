import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { marked } from "marked";
import { sanitizeHtml } from "@/lib/sanitize";

import { Link } from "@/i18n/navigation";
import { ApiPlaygroundLazy } from "@/components/ApiPlaygroundLazy";
import { ApiReference } from "@/components/ApiReference";
import { ApiScreenshot } from "@/components/ApiScreenshot";
import { CopyButton } from "@/components/CopyButton";
import { HealthChart } from "@/components/HealthChart";
import { StatusPill } from "@/components/StatusPill";
import { ContentBlock } from "@/components/ContentBlock";
import { FAQSection } from "@/components/FAQSection";
import {
  fetchApiDetail,
  fetchApiHealthSummary,
  fetchApiOpenapiSpec,
  fetchApisList,
} from "@/lib/backend";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import { formatDateTime } from "@/lib/format";
import { slugify } from "@/lib/slugify";
import {
  GettingStartedGenerator,
  CodeExamplesGenerator,
  FAQGenerator,
} from "@api-navigator/shared/pseo/generators";
import type { FAQItem } from "@api-navigator/shared/pseo";
import { schemaManager } from "@api-navigator/shared/pseo/schemas";
import type { TemplateContext } from "@api-navigator/shared/pseo";

type Props = {
  params: Promise<{ locale: string; id: string; slug: string }>;
};

export async function generateStaticParams() {
  try {
    const apis = await fetchApisList({ limit: "100", sort: "-lastCheckedAt" });
    const params: Array<{ locale: string; id: string; slug: string }> = [];
    for (const api of apis.docs) {
      for (const locale of ["en", "zh"]) {
        params.push({
          locale,
          id: String(api.id),
          slug: slugify(api.name),
        });
      }
    }
    return params;
  } catch {
    return [];
  }
}

export const dynamicParams = true;
export const revalidate = 3600;

function cmsUrl(): string {
  return process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3001";
}

function normalizeOpenApiSpec(
  spec: Record<string, unknown>,
  openapiUrl: string,
): Record<string, unknown> {
  type OpenApiLike = {
    openapi?: unknown;
    swagger?: unknown;
    servers?: Array<{ url?: unknown }>;
    host?: unknown;
    schemes?: unknown;
  };

  const typed = spec as OpenApiLike;
  const base = new URL(openapiUrl);
  const origin = base.origin;
  const host = base.host;
  const scheme = base.protocol.replace(":", "");

  const isOpenApi3 =
    typeof typed.openapi === "string" && typed.openapi.length > 0;
  const isSwagger2 =
    typeof typed.swagger === "string" && typed.swagger.length > 0;

  if (isOpenApi3) {
    const servers = Array.isArray(typed.servers) ? typed.servers : [];
    const normalizedServers =
      servers.length > 0
        ? servers.map((s) => {
            const url = s?.url;
            if (typeof url !== "string" || !url.trim()) return s;

            const trimmed = url.trim();
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
              return s;

            try {
              const absolute = new URL(trimmed, origin).toString();
              return { ...s, url: absolute };
            } catch {
              return s;
            }
          })
        : [{ url: origin }];

    return { ...spec, servers: normalizedServers };
  }

  if (isSwagger2) {
    const next: OpenApiLike & Record<string, unknown> = { ...spec };
    const schemes = Array.isArray(next.schemes)
      ? next.schemes.filter((s): s is string => typeof s === "string" && !!s)
      : [];

    if (typeof next.host !== "string" || !next.host) next.host = host;
    if (schemes.length === 0) next.schemes = [scheme];

    return next;
  }

  return spec;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale, id } = await props.params;
  const [api, t] = await Promise.all([
    fetchApiDetail(id).catch(() => null),
    getTranslations({ locale, namespace: "api" }),
  ]);
  if (!api) return { title: t("apiNotFound") };
  const fallbackDescription =
    api.aiAnalysis?.summary?.trim() || api.description;
  const generatedDescription =
    api.generatedContent?.blogPost &&
    typeof api.generatedContent.blogPost === "string"
      ? api.generatedContent.blogPost
          .replace(/[#*`>_-]/g, " ")
          .slice(0, 180)
          .trim() || null
      : null;
  const description = generatedDescription || fallbackDescription;
  const title =
    (api.generatedContent?.seoTitle && api.generatedContent.seoTitle.trim()) ||
    t("defaultSeoTitle", { name: api.name });
  const canonicalSlug = slugify(api.name);
  const ogImage = `/api/${api.id}/${canonicalSlug}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: `/api/${api.id}/${slugify(api.name)}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/api/${api.id}/${slugify(api.name)}`,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ApiDetailPage(props: Props) {
  const { locale, id, slug } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("api");
  const tCategories = await getTranslations("categories");

  const [api, healthSummary] = await Promise.all([
    fetchApiDetail(id).catch(() => null),
    fetchApiHealthSummary(id, 30).catch(() => null),
  ]);
  if (!api) notFound();

  const description = api.aiAnalysis?.summary?.trim() || api.description;

  const openapiSpec = api.openapiUrl
    ? await fetchApiOpenapiSpec(id)
        .then((spec) => normalizeOpenApiSpec(spec, api.openapiUrl!))
        .catch(() => null)
    : null;

  // Extract API version from OpenAPI spec
  const apiVersion =
    openapiSpec && typeof openapiSpec === "object" && "info" in openapiSpec
      ? (openapiSpec as { info?: { version?: unknown } }).info?.version
        ? String((openapiSpec as { info: { version: unknown } }).info.version)
        : null
      : null;

  const generatedHtml =
    api.generatedContent?.blogPost?.trim() &&
    typeof api.generatedContent.blogPost === "string"
      ? sanitizeHtml(await marked.parse(api.generatedContent.blogPost))
      : null;

  const related =
    api.category?.slug && typeof api.category.slug === "string"
      ? await fetchApisList({ category: api.category.slug, limit: "6" }).then(
          (res) =>
            res.docs.filter((d) => String(d.id) !== String(api.id)).slice(0, 4),
        )
      : [];

  const canonicalSlug = slugify(api.name);
  if (slug !== canonicalSlug) {
    redirect(`/api/${api.id}/${canonicalSlug}`);
  }

  // Build template context for PSEO content generation
  const templateContext: TemplateContext = {
    api: {
      id: typeof api.id === "string" ? parseInt(api.id, 10) : api.id,
      name: api.name,
      description: api.description,
      link: api.link,
      openapiUrl: api.openapiUrl ?? undefined,
      category: api.category
        ? {
            id:
              typeof api.category.id === "string"
                ? parseInt(api.category.id, 10)
                : api.category.id,
            name: api.category.name,
            slug: api.category.slug,
          }
        : undefined,
      auth: api.auth,
      cors: api.cors,
      https: api.https,
      healthStatus: api.healthStatus,
      latencyMs: api.latencyMs ?? undefined,
      lastCheckedAt: api.lastCheckedAt ?? undefined,
      lastError: api.lastError ?? undefined,
      seoMetadata: api.seoMetadata
        ? {
            title: api.seoMetadata.title ?? undefined,
            description: api.seoMetadata.description ?? undefined,
            keywords:
              api.seoMetadata.keywords
                ?.map((k) => ({ keyword: k.keyword ?? "" }))
                .filter((k) => k.keyword) ?? undefined,
            h1: api.seoMetadata.h1 ?? undefined,
            h2s:
              api.seoMetadata.h2s
                ?.map((h) => ({ heading: h.heading ?? "" }))
                .filter((h) => h.heading) ?? undefined,
            languages:
              api.seoMetadata.languages
                ?.map((l) => ({ language: l.language ?? "" }))
                .filter((l) => l.language) ?? undefined,
            docQualityScore: api.seoMetadata.docQualityScore ?? undefined,
            hasCodeExamples: api.seoMetadata.hasCodeExamples ?? undefined,
            ogImage: api.seoMetadata.ogImage ?? undefined,
            extractedAt: api.seoMetadata.extractedAt ?? undefined,
          }
        : undefined,
      aiAnalysis: api.aiAnalysis
        ? {
            summary: api.aiAnalysis.summary ?? undefined,
            useCases:
              api.aiAnalysis.useCases
                ?.map((u) => ({ tag: u.tag ?? "" }))
                .filter((u) => u.tag) ?? undefined,
          }
        : undefined,
      generatedContent: api.generatedContent
        ? {
            seoTitle: api.generatedContent.seoTitle ?? undefined,
            blogPost: api.generatedContent.blogPost ?? undefined,
            model: api.generatedContent.model ?? undefined,
            lastGeneratedAt: api.generatedContent.lastGeneratedAt ?? undefined,
          }
        : undefined,
      screenshot:
        api.screenshot?.thumbnailUrl &&
        api.screenshot?.fullUrl &&
        api.screenshot?.capturedAt
          ? {
              thumbnailUrl: api.screenshot.thumbnailUrl,
              fullUrl: api.screenshot.fullUrl,
              capturedAt: api.screenshot.capturedAt,
            }
          : undefined,
    },
    healthSummary: healthSummary
      ? {
          uptimePct: healthSummary.uptimePct ?? undefined,
          avgLatencyMs: healthSummary.avgLatencyMs ?? undefined,
          series: (healthSummary.series ?? []).map((s) => ({
            date: s.checkedAt ?? "",
            status: s.healthStatus ?? "",
            latencyMs: s.latencyMs ?? undefined,
          })),
        }
      : undefined,
    relatedApis: related.map((r) => ({
      id: typeof r.id === "string" ? parseInt(r.id, 10) : r.id,
      name: r.name,
      description: r.description,
      auth: r.auth,
      cors: r.cors,
      https: r.https,
      category: r.category
        ? {
            name: r.category.name,
            slug: r.category.slug,
          }
        : undefined,
    })),
    locale,
  };

  // Generate dynamic content blocks
  const gettingStartedGen = new GettingStartedGenerator();
  const codeExamplesGen = new CodeExamplesGenerator();
  const faqGen = new FAQGenerator();

  const gettingStartedContent = gettingStartedGen.generate(templateContext);
  const codeExamplesContent =
    api.seoMetadata?.hasCodeExamples || api.seoMetadata?.languages?.length
      ? codeExamplesGen.generate(templateContext)
      : null;
  const faqContent = faqGen.generate(templateContext);

  // Extract FAQ items for structured data and rendering
  const faqItems = extractFAQItems(faqContent);

  // Generate all structured data schemas
  const allSchemas = schemaManager.generateAll(templateContext, faqItems);

  const useCaseTags = api.aiAnalysis?.useCases
    ?.map((t) => t?.tag?.trim())
    .filter((t): t is string => !!t);

  const siteUrl = getSiteUrl();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: SITE_NAME,
        item: siteUrl,
      },
      ...(api.category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: tCategories(api.category.name),
              item: `${siteUrl}/category/${api.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: api.category ? 3 : 2,
        name: api.name,
        item: `${siteUrl}/api/${api.id}/${canonicalSlug}`,
      },
    ],
  };

  // Extract programming languages from SEO metadata
  const programmingLanguages =
    api.seoMetadata?.languages
      ?.map((l) => l?.language?.trim())
      .filter((l): l is string => !!l) || [];

  // Extract keywords from SEO metadata
  const seoKeywords =
    api.seoMetadata?.keywords
      ?.map((k) => k?.keyword?.trim())
      .filter((k): k is string => !!k) || [];

  // Combine all keywords
  const allKeywords = [...new Set([...(useCaseTags || []), ...seoKeywords])];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebAPI",
    name: api.name,
    description,
    url: `${siteUrl}/api/${api.id}/${canonicalSlug}`,
    documentation: api.openapiUrl ?? api.link,
    provider: {
      "@type": "Organization",
      name: api.name,
      url: api.link,
    },
    keywords: allKeywords.length > 0 ? allKeywords.join(", ") : undefined,
    programmingLanguage:
      programmingLanguages.length > 0 ? programmingLanguages : undefined,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Auth", value: api.auth },
      { "@type": "PropertyValue", name: "CORS", value: api.cors },
      {
        "@type": "PropertyValue",
        name: "HTTPS",
        value: api.https ? "Yes" : "No",
      },
      ...(api.seoMetadata?.docQualityScore !== null &&
      api.seoMetadata?.docQualityScore !== undefined
        ? [
            {
              "@type": "PropertyValue",
              name: "Documentation Quality",
              value: `${api.seoMetadata.docQualityScore}/10`,
            },
          ]
        : []),
      ...(api.seoMetadata?.hasCodeExamples
        ? [
            {
              "@type": "PropertyValue",
              name: "Code Examples",
              value: "Yes",
            },
          ]
        : []),
      ...(healthSummary?.uptimePct !== null &&
      healthSummary?.uptimePct !== undefined
        ? [
            {
              "@type": "PropertyValue",
              name: "Uptime (30d)",
              value: `${healthSummary.uptimePct.toFixed(2)}%`,
            },
          ]
        : []),
      ...(healthSummary?.avgLatencyMs !== null &&
      healthSummary?.avgLatencyMs !== undefined
        ? [
            {
              "@type": "PropertyValue",
              name: "Avg latency (30d)",
              value: `${healthSummary.avgLatencyMs}ms`,
            },
          ]
        : []),
    ],
  };

  // SoftwareApplication schema for better SEO
  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: api.name,
    description,
    url: api.link,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web API",
    offers: {
      "@type": "Offer",
      price: api.auth === "No" ? "0" : undefined,
      priceCurrency: api.auth === "No" ? "USD" : undefined,
    },
    ...(api.seoMetadata?.docQualityScore !== null &&
    api.seoMetadata?.docQualityScore !== undefined
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: api.seoMetadata.docQualityScore,
            bestRating: 10,
            worstRating: 1,
            ratingCount: 1,
          },
        }
      : {}),
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <nav className="text-sm text-[var(--text-muted)]" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[var(--text-primary)]">
          {t("breadcrumbHome")}
        </Link>
        {api.category ? (
          <>
            <span className="px-2 text-[var(--text-muted)]">/</span>
            <Link
              href={`/category/${api.category.slug}`}
              className="hover:text-[var(--text-primary)]"
            >
              {tCategories(api.category.name)}
            </Link>
          </>
        ) : null}
        <span className="px-2 text-[var(--text-muted)]">/</span>
        <span className="text-[var(--text-primary)]">{api.name}</span>
      </nav>

      <header className="ui-surface mt-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              {api.name}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {api.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              {api.category ? (
                <span className="ui-chip">
                  {tCategories(api.category.name)}
                </span>
              ) : null}
              {apiVersion ? (
                <span className="ui-chip inline-flex items-center gap-1 bg-[var(--accent-green)]/10 text-[var(--accent-green)]">
                  <svg
                    className="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                      clipRule="evenodd"
                    />
                  </svg>
                  v{apiVersion}
                </span>
              ) : null}
              <span className="ui-chip">
                {t("signalAuth")}: {api.auth}
              </span>
              <span className="ui-chip">
                {t("signalCors")}: {api.cors}
              </span>
              <span className="ui-chip">
                {t("signalHttps")}: {api.https ? t("yes") : t("no")}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
            <StatusPill status={api.healthStatus} />
            <div className="text-right text-xs text-[var(--text-muted)]">
              <div>{formatDateTime(api.lastCheckedAt) ?? t("notChecked")}</div>
              {api.latencyMs !== null ? (
                <div className="font-mono">{api.latencyMs}ms</div>
              ) : null}
            </div>

            {healthSummary && healthSummary.uptimePct !== null ? (
              <div className="flex flex-col items-end gap-2">
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    healthSummary.uptimePct >= 99.9
                      ? "bg-[var(--accent-green)]/10 text-[var(--accent-green)]"
                      : healthSummary.uptimePct >= 99
                        ? "bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]"
                        : healthSummary.uptimePct >= 95
                          ? "bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)]"
                          : "bg-[var(--accent-red)]/10 text-[var(--accent-red)]"
                  }`}
                >
                  <svg
                    className="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {healthSummary.uptimePct.toFixed(2)}% {t("uptime30d")}
                </div>
                {healthSummary.avgLatencyMs !== null ? (
                  <div className="text-xs text-[var(--text-muted)]">
                    <span className="font-mono text-[var(--text-primary)]">
                      {healthSummary.avgLatencyMs}ms
                    </span>{" "}
                    {t("avgLatency")}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Screenshot section - fallback to static file if database has no URL */}
      <section className="ui-surface mt-6 p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          {t("livePreview")}
        </h2>
        <div className="mt-4">
          <ApiScreenshot
            thumbnailUrl={
              api.screenshot?.thumbnailUrl ||
              `/screenshots/${canonicalSlug}.webp`
            }
            fullUrl={
              api.screenshot?.fullUrl || `/screenshots/${canonicalSlug}.webp`
            }
            apiName={api.name}
            capturedAt={api.screenshot?.capturedAt}
          />
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          {t("screenshotNote")}
        </p>
      </section>

      {healthSummary &&
      healthSummary.series &&
      healthSummary.series.length > 0 ? (
        <section className="ui-surface mt-6 p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("healthHistory")}
          </h2>
          <HealthChart series={healthSummary.series} className="mt-4" />
        </section>
      ) : null}

      <section className="ui-surface mt-6 p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          {t("homepage")}
        </h2>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <a
            className="break-all text-sm text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
            href={api.link}
            target="_blank"
            rel="noreferrer"
          >
            {api.link}
          </a>
          <div className="flex items-center gap-2">
            <CopyButton label={t("copyUrl")} value={api.link} />
            <CopyButton label={t("copyCurl")} value={`curl -I ${api.link}`} />
          </div>
        </div>

        {api.lastError ? (
          <div className="ui-surface-muted mt-4 rounded-xl p-3 text-xs text-[var(--text-secondary)]">
            <div className="font-semibold text-[var(--text-primary)]">
              {t("lastError")}
            </div>
            <pre className="mt-2 whitespace-pre-wrap break-words font-mono">
              {api.lastError}
            </pre>
          </div>
        ) : null}

        <p className="mt-5 text-xs text-[var(--text-muted)]">
          {t("availabilityNote")}
        </p>
      </section>

      <section className="ui-surface mt-6 p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          {t("aiAnalysis")}
        </h2>

        {api.aiAnalysis?.summary ? (
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {api.aiAnalysis.summary}
          </p>
        ) : (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {t("notAvailable")}
          </p>
        )}

        {api.aiAnalysis?.useCases?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {api.aiAnalysis.useCases
              .map((t) => t?.tag?.trim())
              .filter((t): t is string => !!t)
              .slice(0, 12)
              .map((tag) => (
                <span key={tag} className="ui-chip">
                  {tag}
                </span>
              ))}
          </div>
        ) : null}
      </section>

      {/* Getting Started Section - PSEO Generated Content */}
      <section className="ui-surface mt-6 p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          {t("gettingStarted")}
        </h2>
        <ContentBlock nodes={gettingStartedContent} />
      </section>

      {/* Authentication Deep Dive Section */}
      {api.auth && api.auth !== "No" && (
        <section className="ui-surface mt-6 p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            🔐 {t("authGuide")}
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--border-dim)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {t("authType")}
                </span>
                <span className="ui-chip bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]">
                  {api.auth}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {api.auth === "apiKey"
                  ? t("authDescApiKey")
                  : api.auth === "OAuth"
                    ? t("authDescOAuth")
                    : api.auth === "X-Mashape-Key"
                      ? t("authDescMashape")
                      : api.auth === "User-Agent"
                        ? t("authDescUserAgent")
                        : t("authDescOther")}
              </p>
            </div>

            {/* Common Authentication Patterns */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {t("commonImplementation")}
              </h3>
              <div className="rounded-lg bg-[var(--bg-tertiary)] p-4 font-mono text-xs overflow-x-auto">
                {api.auth === "apiKey" && (
                  <div className="space-y-2">
                    <div className="text-[var(--text-muted)]"># Using cURL</div>
                    <div className="text-[var(--text-secondary)]">
                      curl -H "Authorization: Bearer YOUR_API_KEY" {api.link}
                    </div>
                    <div className="mt-3 text-[var(--text-muted)]">
                      # Using JavaScript
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      fetch('{api.link}', {"{"}
                      <br />
                      &nbsp;&nbsp;headers: {"{"} 'Authorization': 'Bearer
                      YOUR_API_KEY' {"}"}
                      <br />
                      {"}"})
                    </div>
                  </div>
                )}
                {api.auth === "OAuth" && (
                  <div className="space-y-2">
                    <div className="text-[var(--text-muted)]">
                      # Step 1: Obtain authorization code
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      GET
                      /oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_CALLBACK
                    </div>
                    <div className="mt-3 text-[var(--text-muted)]">
                      # Step 2: Exchange code for token
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      POST /oauth/token
                      <br />
                      client_id=YOUR_CLIENT_ID&client_secret=YOUR_SECRET&code=AUTH_CODE
                    </div>
                  </div>
                )}
                {api.auth === "X-Mashape-Key" && (
                  <div className="space-y-2">
                    <div className="text-[var(--text-muted)]"># Using cURL</div>
                    <div className="text-[var(--text-secondary)]">
                      curl -H "X-Mashape-Key: YOUR_KEY" {api.link}
                    </div>
                  </div>
                )}
                {api.auth === "User-Agent" && (
                  <div className="space-y-2">
                    <div className="text-[var(--text-muted)]"># Using cURL</div>
                    <div className="text-[var(--text-secondary)]">
                      curl -H "User-Agent: YourApp/1.0" {api.link}
                    </div>
                  </div>
                )}
                {!["apiKey", "OAuth", "X-Mashape-Key", "User-Agent"].includes(
                  api.auth,
                ) && (
                  <div className="text-[var(--text-secondary)]">
                    Refer to the official documentation for authentication
                    details.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-[var(--accent-yellow)]/5 border border-[var(--accent-yellow)]/20 p-4">
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-[var(--accent-yellow)] mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[var(--accent-yellow)] mb-1">
                    {t("securityBestPractices")}
                  </div>
                  <ul className="text-xs text-[var(--text-secondary)] space-y-1 list-disc list-inside">
                    <li>{t("securityPractice1")}</li>
                    <li>{t("securityPractice2")}</li>
                    <li>{t("securityPractice3")}</li>
                    <li>{t("securityPractice4")}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Rate Limits - Placeholder Section */}
      <section className="ui-surface mt-6 p-6 border-2 border-dashed border-[var(--border-dim)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            ⏱️ {t("rateLimitsTitle")}
          </h2>
          <span className="text-xs bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)] px-2 py-1 rounded-full font-semibold">
            {t("comingSoon")}
          </span>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          {t("rateLimitsDesc")}
        </p>
        <div className="mt-4 grid gap-2 opacity-50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">
              {t("requestsPerMinute")}
            </span>
            <span className="font-mono text-[var(--text-secondary)]">–</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">{t("dailyQuota")}</span>
            <span className="font-mono text-[var(--text-secondary)]">–</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">{t("burstLimit")}</span>
            <span className="font-mono text-[var(--text-secondary)]">–</span>
          </div>
        </div>
      </section>

      {/* SDKs & Libraries - Placeholder Section */}
      <section className="ui-surface mt-6 p-6 border-2 border-dashed border-[var(--border-dim)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            📦 {t("sdksTitle")}
          </h2>
          <span className="text-xs bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)] px-2 py-1 rounded-full font-semibold">
            {t("comingSoon")}
          </span>
        </div>
        <p className="text-sm text-[var(--text-muted)]">{t("sdksDesc")}</p>
        <div className="mt-4 flex flex-wrap gap-2 opacity-50">
          {["Python", "JavaScript", "Ruby", "Go", "Java", "PHP"].map((lang) => (
            <div
              key={lang}
              className="flex items-center gap-2 rounded-lg bg-[var(--bg-secondary)] px-3 py-2 border border-[var(--border-dim)]"
            >
              <svg
                className="h-4 w-4 text-[var(--text-muted)]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs text-[var(--text-secondary)]">
                {lang}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing - Placeholder Section */}
      <section className="ui-surface mt-6 p-6 border-2 border-dashed border-[var(--border-dim)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            💰 {t("pricingTitle")}
          </h2>
          <span className="text-xs bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)] px-2 py-1 rounded-full font-semibold">
            {t("comingSoon")}
          </span>
        </div>
        <p className="text-sm text-[var(--text-muted)]">{t("pricingDesc")}</p>
        <div className="mt-4 grid md:grid-cols-3 gap-3 opacity-50">
          <div className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--border-dim)]">
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {t("pricingFree")}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              {t("pricingBasic")}
            </div>
            <div className="mt-2 text-lg font-bold text-[var(--text-primary)]">
              $0
            </div>
          </div>
          <div className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--border-dim)]">
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {t("pricingPro")}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              {t("pricingEnhanced")}
            </div>
            <div className="mt-2 text-lg font-bold text-[var(--text-primary)]">
              –
            </div>
          </div>
          <div className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--border-dim)]">
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {t("pricingEnterprise")}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              {t("pricingCustom")}
            </div>
            <div className="mt-2 text-lg font-bold text-[var(--text-primary)]">
              –
            </div>
          </div>
        </div>
      </section>

      {/* Code Examples Section - PSEO Generated Content */}
      {codeExamplesContent && (
        <section className="ui-surface mt-6 p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Code Examples
          </h2>
          <ContentBlock nodes={codeExamplesContent} />
        </section>
      )}

      {api.seoMetadata?.extractedAt ? (
        <section className="ui-surface mt-6 p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("seoTitle")}
          </h2>

          {/* Documentation Quality Score */}
          {api.seoMetadata.docQualityScore !== null &&
          api.seoMetadata.docQualityScore !== undefined ? (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">
                {t("docQuality")}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(10)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-4 w-4 ${
                        i < (api.seoMetadata?.docQualityScore || 0)
                          ? "text-[var(--accent-yellow)]"
                          : "text-[var(--border-dim)]"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="font-mono text-sm text-[var(--text-primary)]">
                  {api.seoMetadata.docQualityScore}/10
                </span>
              </div>
            </div>
          ) : null}

          {/* Quality Indicators */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {api.seoMetadata.hasCodeExamples ? (
              <span className="ui-chip inline-flex items-center gap-1">
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("codeExamples")}
              </span>
            ) : null}
            {api.seoMetadata.h1 ? (
              <span className="ui-chip">{t("mainHeading")}</span>
            ) : null}
            {api.seoMetadata.ogImage ? (
              <span className="ui-chip">{t("openGraph")}</span>
            ) : null}
          </div>

          {/* Programming Languages */}
          {api.seoMetadata.languages && api.seoMetadata.languages.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-[var(--text-muted)]">
                {t("programmingLanguages")}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {api.seoMetadata.languages
                  .map((l) => l?.language?.trim())
                  .filter((l): l is string => !!l)
                  .map((lang) => (
                    <span
                      key={lang}
                      className="ui-chip inline-flex items-center gap-1 capitalize"
                    >
                      <svg
                        className="h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {lang}
                    </span>
                  ))}
              </div>
            </div>
          ) : null}

          {/* Keywords */}
          {api.seoMetadata.keywords && api.seoMetadata.keywords.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-[var(--text-muted)]">
                {t("keywords")}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {api.seoMetadata.keywords
                  .map((k) => k?.keyword?.trim())
                  .filter((k): k is string => !!k)
                  .slice(0, 15)
                  .map((keyword, idx) => (
                    <span key={idx} className="ui-chip text-xs">
                      {keyword}
                    </span>
                  ))}
              </div>
            </div>
          ) : null}

          {/* Document Structure - H2s */}
          {api.seoMetadata.h2s && api.seoMetadata.h2s.length > 0 ? (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                {t("sectionHeadings")} ({api.seoMetadata.h2s.length})
              </summary>
              <ul className="mt-2 space-y-1 pl-4">
                {api.seoMetadata.h2s
                  .map((h) => h?.heading?.trim())
                  .filter((h): h is string => !!h)
                  .map((heading, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-[var(--text-secondary)]"
                    >
                      <span className="text-[var(--accent-cyan)]">-</span>{" "}
                      {heading}
                    </li>
                  ))}
              </ul>
            </details>
          ) : null}

          {/* Page Title & Description */}
          {(api.seoMetadata.title || api.seoMetadata.description) && (
            <div className="ui-surface-muted mt-4 rounded-lg p-4 text-xs">
              {api.seoMetadata.title ? (
                <div className="mb-2">
                  <span className="font-semibold text-[var(--text-muted)]">
                    {t("pageTitle")}:{" "}
                  </span>
                  <span className="text-[var(--text-secondary)]">
                    {api.seoMetadata.title}
                  </span>
                </div>
              ) : null}
              {api.seoMetadata.description ? (
                <div>
                  <span className="font-semibold text-[var(--text-muted)]">
                    {t("metaDescription")}:{" "}
                  </span>
                  <span className="text-[var(--text-secondary)]">
                    {api.seoMetadata.description}
                  </span>
                </div>
              ) : null}
            </div>
          )}

          <p className="mt-4 text-xs text-[var(--text-muted)]">
            {t("seoNote")}
          </p>
        </section>
      ) : null}

      <section className="ui-surface mt-6 p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          {t("openApi")}
        </h2>

        {api.openapiUrl ? (
          <div className="mt-3 space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <a
                className="break-all text-sm text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
                href={api.openapiUrl}
                target="_blank"
                rel="noreferrer"
              >
                {api.openapiUrl}
              </a>
              <div className="flex items-center gap-2">
                <CopyButton label={t("copyUrl")} value={api.openapiUrl} />
              </div>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              {t("openApiNote")}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {t("noOpenApi")}
          </p>
        )}
      </section>

      {openapiSpec ? (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            {t("apiReference")}
          </h2>
          <ApiReference
            apiId={Number(api.id)}
            cmsUrl={cmsUrl()}
            spec={openapiSpec}
          />
        </section>
      ) : null}

      <ApiPlaygroundLazy
        apiId={Number(api.id)}
        cmsUrl={cmsUrl()}
        defaultUrl={api.link}
      />

      {generatedHtml ? (
        <section className="ui-surface mt-6 p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {api.generatedContent?.seoTitle?.trim() || t("deepDive")}
          </h2>
          <article
            className="prose prose-invert max-w-none text-sm leading-relaxed prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-ul:text-[var(--text-secondary)] prose-ol:text-[var(--text-secondary)] prose-strong:text-[var(--text-primary)] prose-a:text-[var(--accent-green)]"
            dangerouslySetInnerHTML={{ __html: generatedHtml }}
          />
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            {t("aiGenNote", {
              model: api.generatedContent?.model ?? "n/a",
              date: api.generatedContent?.lastGeneratedAt ?? "n/a",
            })}
          </p>
        </section>
      ) : null}

      <section className="ui-surface mt-6 p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          {t("keySignals")}
        </h2>
        <div className="ui-surface-muted overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-[var(--border-dim)] text-sm">
            <tbody className="divide-y divide-[var(--border-dim)] bg-[var(--bg-secondary)]">
              <tr>
                <td className="px-4 py-2 text-[var(--text-secondary)]">
                  {t("signalAuth")}
                </td>
                <td className="px-4 py-2 font-mono text-[var(--accent-green)]">
                  {api.auth}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-[var(--text-secondary)]">
                  {t("signalCors")}
                </td>
                <td className="px-4 py-2 font-mono text-[var(--accent-green)]">
                  {api.cors}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-[var(--text-secondary)]">
                  {t("signalHttps")}
                </td>
                <td className="px-4 py-2 font-mono text-[var(--accent-green)]">
                  {api.https ? t("yes") : t("no")}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-[var(--text-secondary)]">
                  {t("signalLastChecked")}
                </td>
                <td className="px-4 py-2 font-mono text-[var(--accent-green)]">
                  {formatDateTime(api.lastCheckedAt) ?? t("notChecked")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          {t("signalsNote")}
        </p>
      </section>

      {related.length > 0 ? (
        <section className="ui-surface mt-6 p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {api.category?.name
              ? t("moreIn", { category: tCategories(api.category.name) })
              : t("moreInDefault")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
            {related.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3"
              >
                <Link
                  className="font-medium text-[var(--text-primary)] hover:underline"
                  href={`/api/${item.id}/${slugify(item.name)}`}
                >
                  {item.name}
                </Link>
                <span className="text-xs text-[var(--text-muted)]">
                  {item.auth} - {item.cors} - {item.https ? "HTTPS" : "HTTP"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Error Codes & Troubleshooting Section */}
      {openapiSpec && (
        <section className="ui-surface mt-6 p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            {t("errorCodesTitle")}
          </h2>
          <div className="space-y-4">
            {/* Common HTTP Status Codes */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {t("commonHttpStatusCodes")}
              </h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 rounded-lg bg-[var(--bg-secondary)] p-3 border border-[var(--border-dim)]">
                  <span className="font-mono text-xs font-semibold text-[var(--accent-green)] bg-[var(--accent-green)]/10 px-2 py-1 rounded">
                    200
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {t("status200")}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {t("status200Desc")}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-[var(--bg-secondary)] p-3 border border-[var(--border-dim)]">
                  <span className="font-mono text-xs font-semibold text-[var(--accent-yellow)] bg-[var(--accent-yellow)]/10 px-2 py-1 rounded">
                    400
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {t("status400")}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {t("status400Desc")}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-[var(--bg-secondary)] p-3 border border-[var(--border-dim)]">
                  <span className="font-mono text-xs font-semibold text-[var(--accent-red)] bg-[var(--accent-red)]/10 px-2 py-1 rounded">
                    401
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {t("status401")}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {t("status401Desc")}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-[var(--bg-secondary)] p-3 border border-[var(--border-dim)]">
                  <span className="font-mono text-xs font-semibold text-[var(--accent-red)] bg-[var(--accent-red)]/10 px-2 py-1 rounded">
                    403
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {t("status403")}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {t("status403Desc")}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-[var(--bg-secondary)] p-3 border border-[var(--border-dim)]">
                  <span className="font-mono text-xs font-semibold text-[var(--accent-red)] bg-[var(--accent-red)]/10 px-2 py-1 rounded">
                    429
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {t("status429")}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {t("status429Desc")}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-[var(--bg-secondary)] p-3 border border-[var(--border-dim)]">
                  <span className="font-mono text-xs font-semibold text-[var(--accent-red)] bg-[var(--accent-red)]/10 px-2 py-1 rounded">
                    500
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[var(--text-primary)]">
                      {t("status500")}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {t("status500Desc")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Troubleshooting Checklist */}
            <div className="rounded-lg bg-[var(--accent-cyan)]/5 border border-[var(--accent-cyan)]/20 p-4">
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-[var(--accent-cyan)] mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[var(--accent-cyan)] mb-2">
                    {t("debugChecklist")}
                  </div>
                  <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 list-disc list-inside">
                    <li>{t("debugCheckItem1")}</li>
                    <li>{t("debugCheckItem2")}</li>
                    <li>{t("debugCheckItem3")}</li>
                    <li>{t("debugCheckItem4")}</li>
                    <li>{t("debugCheckItem5")}</li>
                    <li>{t("debugCheckItem6")}</li>
                    <li>{t("debugCheckItem7")}</li>
                  </ul>
                </div>
              </div>
            </div>

            {api.lastError && (
              <div className="rounded-lg bg-[var(--accent-red)]/5 border border-[var(--accent-red)]/20 p-4">
                <div className="text-sm font-semibold text-[var(--accent-red)] mb-2">
                  {t("latestError")}
                </div>
                <pre className="text-xs text-[var(--text-secondary)] font-mono whitespace-pre-wrap break-words">
                  {api.lastError}
                </pre>
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQ Section - PSEO Generated Content */}
      <FAQSection
        items={faqItems}
        title={t("faq") || "Frequently Asked Questions"}
      />

      <section className="ui-surface mt-6 p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          {t("source")}
        </h2>
        <div className="mt-3 grid gap-2 text-sm text-[var(--text-secondary)]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--text-muted)]">{t("upstream")}</span>
            <span className="font-mono">{api.source?.repo ?? "-"}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--text-muted)]">{t("path")}</span>
            <span className="font-mono">{api.source?.path ?? "-"}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[var(--text-muted)]">{t("commit")}</span>
            <span className="font-mono">{api.source?.commitSha ?? "-"}</span>
          </div>
        </div>
      </section>

      {/* Output all structured data schemas - PSEO Generated */}
      {allSchemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </main>
  );
}

// Helper function to extract FAQ items from ContentNode[]
function extractFAQItems(
  nodes: import("@api-navigator/shared/pseo").ContentNode[],
): FAQItem[] {
  const faqItems: FAQItem[] = [];
  let currentCategory: import("@api-navigator/shared/pseo").FAQCategory =
    "general";
  let currentQuestion = "";
  let currentAnswer = "";

  for (const node of nodes) {
    if (node.type === "heading" && node.level === 3) {
      // Category heading (e.g., "Technical Questions")
      const categoryText = node.text.toLowerCase();
      if (categoryText.includes("technical")) currentCategory = "technical";
      else if (categoryText.includes("security")) currentCategory = "security";
      else if (categoryText.includes("support")) currentCategory = "support";
      else if (categoryText.includes("pricing")) currentCategory = "pricing";
      else currentCategory = "general";
    } else if (node.type === "heading" && node.level === 4) {
      // Save previous FAQ if exists
      if (currentQuestion && currentAnswer) {
        faqItems.push({
          question: currentQuestion,
          answer: currentAnswer,
          category: currentCategory,
        });
      }
      // Start new FAQ
      currentQuestion = node.text;
      currentAnswer = "";
    } else if (node.type === "paragraph" && currentQuestion) {
      // Accumulate answer
      currentAnswer += (currentAnswer ? " " : "") + node.text;
    }
  }

  // Add last FAQ item
  if (currentQuestion && currentAnswer) {
    faqItems.push({
      question: currentQuestion,
      answer: currentAnswer,
      category: currentCategory,
    });
  }

  return faqItems;
}

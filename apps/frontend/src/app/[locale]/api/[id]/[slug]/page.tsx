import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

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
  const { id } = await props.params;
  const api = await fetchApiDetail(id).catch(() => null);
  if (!api) return { title: "API not found" };
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
    `${api.name} API Documentation & Review`;
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
  const generatedHtml =
    api.generatedContent?.blogPost?.trim() &&
    typeof api.generatedContent.blogPost === "string"
      ? DOMPurify.sanitize(await marked.parse(api.generatedContent.blogPost))
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
      ...api,
      id: typeof api.id === "string" ? parseInt(api.id, 10) : api.id,
    },
    healthSummary: healthSummary
      ? {
          uptimePct: healthSummary.uptimePct ?? undefined,
          avgLatencyMs: healthSummary.avgLatencyMs ?? undefined,
          series: healthSummary.series,
        }
      : undefined,
    relatedApis: related.map((r) => ({
      ...r,
      id: typeof r.id === "string" ? parseInt(r.id, 10) : r.id,
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
  const programmingLanguages = api.seoMetadata?.languages
    ?.map((l) => l?.language?.trim())
    .filter((l): l is string => !!l) || [];

  // Extract keywords from SEO metadata
  const seoKeywords = api.seoMetadata?.keywords
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
    programmingLanguage: programmingLanguages.length > 0 ? programmingLanguages : undefined,
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
              <div className="text-right text-xs text-[var(--text-muted)]">
                <div>
                  {t("uptime30d")}{" "}
                  <span className="font-medium text-[var(--text-primary)]">
                    {healthSummary.uptimePct.toFixed(2)}%
                  </span>
                </div>
                {healthSummary.avgLatencyMs !== null ? (
                  <div className="font-mono">
                    {healthSummary.avgLatencyMs}ms {t("avgLatency")}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {api.screenshot?.thumbnailUrl ? (
        <section className="ui-surface mt-6 p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("livePreview")}
          </h2>
          <div className="mt-4">
            <ApiScreenshot
              thumbnailUrl={api.screenshot.thumbnailUrl}
              fullUrl={api.screenshot.fullUrl}
              apiName={api.name}
              capturedAt={api.screenshot.capturedAt}
            />
          </div>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            {t("screenshotNote")}
          </p>
        </section>
      ) : null}

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
          Getting Started
        </h2>
        <ContentBlock nodes={gettingStartedContent} />
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

      {/* FAQ Section - PSEO Generated Content */}
      <FAQSection items={faqItems} title={t("faq") || "Frequently Asked Questions"} />

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
function extractFAQItems(nodes: import("@api-navigator/shared/pseo").ContentNode[]): FAQItem[] {
  const faqItems: FAQItem[] = [];
  let currentCategory: import("@api-navigator/shared/pseo").FAQCategory = "general";
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

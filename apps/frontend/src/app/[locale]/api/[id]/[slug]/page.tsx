import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { marked } from "marked";
import { sanitizeHtml } from "@/lib/sanitize";

import { Link } from "@/i18n/navigation";
import { ApiPlaygroundLazy } from "@/components/ApiPlaygroundLazy";
import { ApiReference } from "@/components/ApiReference";
import { ContentBlock } from "@/components/ContentBlock";
import { FAQSection } from "@/components/FAQSection";
import {
  ApiHeader,
  ApiHealthSection,
  ApiScreenshotSection,
  ApiHomepageSection,
  ApiAiAnalysisSection,
  ApiAuthenticationSection,
  ApiSeoContentSection,
  ApiOpenApiSection,
  ApiGeneratedContentSection,
  ApiKeySignalsSection,
  ApiRelatedApisSection,
  ApiErrorCodesSection,
  ApiSourceSection,
} from "@/components/api-detail";
import {
  fetchApiDetail,
  fetchApiHealthSummary,
  fetchApiOpenapiSpec,
  fetchApisList,
} from "@/lib/backend";
import { getSiteUrl } from "@/lib/site";
import { slugify } from "@/lib/slugify";
import { locales, type Locale } from "@/i18n/config";
import { toOpenGraphLocale, generateHreflangUrls } from "@/lib/locales";
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
      // SEO: Pre-render all 6 supported locales for better internationalization
      for (const locale of locales) {
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

  // Safely parse the URL - return spec unchanged if URL is invalid
  let base: URL;
  try {
    base = new URL(openapiUrl);
  } catch {
    console.warn(`[normalizeOpenApiSpec] Invalid openapiUrl: ${openapiUrl}`);
    return spec;
  }
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
  const siteUrl = getSiteUrl();
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
  const canonicalPath = `/api/${api.id}/${canonicalSlug}`;
  const ogImage = `/api/${api.id}/${canonicalSlug}/opengraph-image`;

  // SEO: Generate hreflang links for all language versions
  // This prevents duplicate content issues and helps search engines serve the correct language
  const hreflangUrls = generateHreflangUrls(canonicalPath, siteUrl);

  // SEO: Use consistent locale formatting via helper function
  const ogLocale = toOpenGraphLocale(locale as Locale);

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}${canonicalPath}`,
      languages: hreflangUrls,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteUrl}/${locale}${canonicalPath}`,
      images: [{ url: ogImage }],
      locale: ogLocale,
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

  let generatedHtml: string | null = null;
  if (
    api.generatedContent?.blogPost?.trim() &&
    typeof api.generatedContent.blogPost === "string"
  ) {
    try {
      generatedHtml = sanitizeHtml(
        await marked.parse(api.generatedContent.blogPost),
      );
    } catch (err) {
      console.warn(`[ApiDetailPage] Failed to parse blogPost markdown:`, err);
    }
  }

  const related =
    api.category?.slug && typeof api.category.slug === "string"
      ? await fetchApisList({ category: api.category.slug, limit: "6" })
          .then((res) =>
            res.docs.filter((d) => String(d.id) !== String(api.id)).slice(0, 4),
          )
          .catch(() => [])
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

  // Generate dynamic content blocks with error handling
  const gettingStartedGen = new GettingStartedGenerator();
  const codeExamplesGen = new CodeExamplesGenerator();
  const faqGen = new FAQGenerator();

  let gettingStartedContent: import("@api-navigator/shared/pseo").ContentNode[] =
    [];
  let codeExamplesContent:
    | import("@api-navigator/shared/pseo").ContentNode[]
    | null = null;
  let faqContent: import("@api-navigator/shared/pseo").ContentNode[] = [];

  try {
    gettingStartedContent = gettingStartedGen.generate(templateContext);
  } catch (err) {
    console.warn(`[ApiDetailPage] Failed to generate getting started:`, err);
  }

  try {
    if (
      api.seoMetadata?.hasCodeExamples ||
      api.seoMetadata?.languages?.length
    ) {
      codeExamplesContent = codeExamplesGen.generate(templateContext);
    }
  } catch (err) {
    console.warn(`[ApiDetailPage] Failed to generate code examples:`, err);
  }

  try {
    faqContent = faqGen.generate(templateContext);
  } catch (err) {
    console.warn(`[ApiDetailPage] Failed to generate FAQ:`, err);
  }

  // Extract FAQ items for structured data and rendering
  const faqItems = extractFAQItems(faqContent);

  // Generate all structured data schemas with error handling
  let allSchemas: import("@api-navigator/shared/pseo/schemas").SchemaContext[] =
    [];
  try {
    allSchemas = schemaManager.generateAll(templateContext, faqItems);
  } catch (err) {
    console.warn(`[ApiDetailPage] Failed to generate schemas:`, err);
  }

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

      <ApiHeader
        api={api}
        healthSummary={healthSummary}
        apiVersion={apiVersion}
        t={t}
        tCategories={tCategories}
      />

      <ApiScreenshotSection api={api} canonicalSlug={canonicalSlug} t={t} />

      <ApiHealthSection healthSummary={healthSummary} t={t} />

      <ApiHomepageSection api={api} t={t} />

      <ApiAiAnalysisSection api={api} t={t} />

      {/* Getting Started Section - PSEO Generated Content */}
      <section className="ui-surface mt-6 p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          {t("gettingStarted")}
        </h2>
        <ContentBlock nodes={gettingStartedContent} />
      </section>

      <ApiAuthenticationSection api={api} t={t} />

      {/* Code Examples Section - PSEO Generated Content */}
      {codeExamplesContent && (
        <section className="ui-surface mt-6 p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Code Examples
          </h2>
          <ContentBlock nodes={codeExamplesContent} />
        </section>
      )}

      <ApiSeoContentSection api={api} t={t} />

      <ApiOpenApiSection api={api} t={t} />

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

      <ApiGeneratedContentSection
        api={api}
        generatedHtml={generatedHtml}
        t={t}
      />

      <ApiKeySignalsSection api={api} t={t} />

      <ApiRelatedApisSection
        relatedApis={related}
        categoryName={api.category?.name}
        t={t}
        tCategories={tCategories}
      />

      <ApiErrorCodesSection api={api} hasOpenApiSpec={!!openapiSpec} t={t} />

      {/* FAQ Section - PSEO Generated Content */}
      <FAQSection
        items={faqItems}
        title={t("faq") || "Frequently Asked Questions"}
      />

      <ApiSourceSection api={api} t={t} />

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
  if (!nodes || !Array.isArray(nodes)) return [];

  const faqItems: FAQItem[] = [];
  let currentCategory: import("@api-navigator/shared/pseo").FAQCategory =
    "general";
  let currentQuestion = "";
  let currentAnswer = "";

  for (const node of nodes) {
    if (!node || typeof node.type !== "string") continue;

    if (node.type === "heading" && node.level === 3) {
      // Category heading (e.g., "Technical Questions")
      const categoryText = (node.text ?? "").toLowerCase();
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
      currentQuestion = node.text ?? "";
      currentAnswer = "";
    } else if (node.type === "paragraph" && currentQuestion) {
      // Accumulate answer
      currentAnswer += (currentAnswer ? " " : "") + (node.text ?? "");
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

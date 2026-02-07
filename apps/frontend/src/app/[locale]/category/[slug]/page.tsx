import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CatalogPage } from "@/app/_components/CatalogPage";
import { fetchCategories, fetchApisList } from "@/lib/backend";
import { getSiteUrl } from "@/lib/site";
import {
  generateHreflangUrls,
  toLocalizedPath,
  toLocalizedUrl,
  toOpenGraphLocale,
} from "@/lib/locales";
import { slugify } from "@/lib/slugify";
import type { Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams?: Record<string, string | string[] | undefined>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, locale } = await props.params;
  const siteUrl = getSiteUrl();

  const categories = await fetchCategories().catch(() => []);
  const category = categories.find((c) => c.slug === slug);

  const tCategories = await getTranslations({
    locale,
    namespace: "categories",
  });

  const tCatalog = await getTranslations({
    locale,
    namespace: "catalog",
  });

  const categoryName = category?.name;
  const translatedName = categoryName ? tCategories(categoryName) : undefined;

  const title = translatedName
    ? tCatalog("categoryTitle", { category: translatedName })
    : tCatalog("title");
  const description =
    category && translatedName
      ? `${tCatalog("categorySubtitle", { category: translatedName })}`
      : tCatalog("subtitle");

  // SEO: Generate locale-aware canonical and hreflang URLs
  const basePath = `/category/${slug}`;
  const localizedCategoryUrl = toLocalizedUrl(siteUrl, basePath, locale as Locale);
  const hreflangUrls = generateHreflangUrls(basePath, siteUrl);
  const ogLocale = toOpenGraphLocale(locale as Locale);

  return {
    title,
    description,
    alternates: {
      canonical: localizedCategoryUrl,
      languages: hreflangUrls,
    },
    // SEO: OpenGraph meta tags for category pages
    openGraph: {
      title,
      description,
      type: "website",
      url: localizedCategoryUrl,
      siteName: "API Navigator",
      locale: ogLocale,
      images: [
        {
          url: `${siteUrl}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    // SEO: Twitter Card meta tags for category pages
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@api_navigator",
      images: [`${siteUrl}/opengraph-image`],
    },
  };
}

/**
 * SEO: Generate BreadcrumbList and ItemList Schema.org structured data for category pages
 */
function generateCategorySchemas(
  siteUrl: string,
  locale: string,
  categoryName: string,
  categorySlug: string,
  apis: Array<{ id: number | string; name: string; description: string }>
) {
  const schemas = [];

  // BreadcrumbList schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Categories",
        item: `${siteUrl}${toLocalizedPath("/catalog", locale as Locale)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: `${siteUrl}${toLocalizedPath(
          `/category/${categorySlug}`,
          locale as Locale,
        )}`,
      },
    ],
  });

  // CollectionPage schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryName} APIs`,
    description: `Browse and discover ${categoryName} APIs. Find the best free and open APIs for ${categoryName.toLowerCase()} integration.`,
    url: `${siteUrl}${toLocalizedPath(
      `/category/${categorySlug}`,
      locale as Locale,
    )}`,
    isPartOf: {
      "@type": "WebSite",
      name: "API Navigator",
      url: siteUrl,
    },
    about: {
      "@type": "Thing",
      name: categoryName,
    },
  });

  // ItemList schema with API entries (limit to first 10 for performance)
  if (apis.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${categoryName} APIs`,
      description: `List of ${apis.length}+ APIs in the ${categoryName} category`,
      numberOfItems: apis.length,
      itemListElement: apis.slice(0, 10).map((api, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: api.name,
        description: api.description,
        url: `${siteUrl}${toLocalizedPath(
          `/api/${api.id}/${slugify(api.name)}`,
          locale as Locale,
        )}`,
      })),
    });
  }

  return schemas;
}

export default async function CategoryPage(props: Props) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);

  const siteUrl = getSiteUrl();

  // Fetch category info and APIs for Schema.org structured data
  const [categories, apisResult] = await Promise.all([
    fetchCategories().catch(() => []),
    fetchApisList({ category: slug, limit: "20" }).catch(() => ({ docs: [] })),
  ]);

  const category = categories.find((c) => c.slug === slug);
  const tCategories = await getTranslations({
    locale,
    namespace: "categories",
  });

  const categoryName = category?.name
    ? tCategories(category.name)
    : slug.charAt(0).toUpperCase() + slug.slice(1);

  const apis = apisResult.docs.map((api) => ({
    id: api.id,
    name: api.name,
    description: api.description,
  }));

  const schemas = generateCategorySchemas(
    siteUrl,
    locale,
    categoryName,
    slug,
    apis
  );

  return (
    <>
      <CatalogPage
        basePath={`/category/${slug}`}
        fixedCategorySlug={slug}
        searchParams={props.searchParams}
      />
      {/* SEO: Schema.org structured data for category pages */}
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

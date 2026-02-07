import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { fetchCategories } from "@/lib/backend";
import { fetchPublicApisRepoStats, fallbackRepoStats } from "@/lib/github";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import {
  generateHreflangUrls,
  toLocalizedPath,
  toLocalizedUrl,
} from "@/lib/locales";
import type { Locale } from "@/i18n/config";
import {
  CatalogHero,
  CatalogFilters,
  CatalogError,
} from "@/components/catalog";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

const siteUrl = getSiteUrl();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  const localizedCatalogUrl = toLocalizedUrl(
    siteUrl,
    "/catalog",
    locale as Locale,
  );

  // SEO: Generate locale-aware canonical and hreflang URLs
  const hreflangUrls = generateHreflangUrls("/catalog", siteUrl);

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: localizedCatalogUrl,
      languages: hreflangUrls,
    },
    openGraph: {
      title: `${t("title")} | ${SITE_NAME}`,
      description: t("subtitle"),
      url: localizedCatalogUrl,
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

export default async function Catalog({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("catalog");
  const tNav = await getTranslations("nav");
  const tCategories = await getTranslations("categories");
  const tCatalogPage = await getTranslations("catalogPage");

  let categories: Awaited<ReturnType<typeof fetchCategories>> = [];
  let repoStats: Awaited<ReturnType<typeof fetchPublicApisRepoStats>> =
    fallbackRepoStats();

  try {
    [categories, repoStats] = await Promise.all([
      fetchCategories(),
      fetchPublicApisRepoStats().catch(() => fallbackRepoStats()),
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return <CatalogError t={t} errorMessage={errorMessage} />;
  }

  const totalApis = categories.reduce((sum, c) => sum + c.apiCount, 0);
  const stats = {
    totalApis,
    categories: categories.length,
    stars: repoStats.stars,
    forks: repoStats.forks,
  };

  const catalogJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("title"),
    description: t("subtitle"),
    url: `${siteUrl}${toLocalizedPath("/catalog", locale as Locale)}`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: siteUrl },
    numberOfItems: categories.length,
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: categories.length,
      itemListElement: categories.slice(0, 20).map((cat, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "CollectionPage",
          name: cat.name,
          url: `${siteUrl}${toLocalizedPath(
            `/category/${cat.slug}`,
            locale as Locale,
          )}`,
          numberOfItems: cat.apiCount,
        },
      })),
    },
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <CatalogHero
        stats={stats}
        t={t}
        tNav={tNav}
        tCatalogPage={tCatalogPage}
      />
      <CatalogFilters
        categories={categories}
        t={t}
        tCategories={tCategories}
        tCatalogPage={tCatalogPage}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogJsonLd) }}
      />
    </main>
  );
}

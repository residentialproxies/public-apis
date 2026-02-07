import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogPage } from "@/app/_components/CatalogPage";
import { getSiteUrl } from "@/lib/site";
import { generateHreflangUrls, toLocalizedUrl } from "@/lib/locales";
import type { Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "search" });
  const tMeta = await getTranslations({ locale, namespace: "metadata" });
  const siteUrl = getSiteUrl();
  const localizedSearchUrl = toLocalizedUrl(siteUrl, "/search", locale as Locale);

  // SEO: Generate locale-aware canonical and hreflang URLs
  const hreflangUrls = generateHreflangUrls("/search", siteUrl);

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: localizedSearchUrl,
      languages: hreflangUrls,
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: localizedSearchUrl,
      siteName: tMeta("title"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
  };
}

export default async function Search({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CatalogPage basePath="/search" searchParams={searchParams} />;
}

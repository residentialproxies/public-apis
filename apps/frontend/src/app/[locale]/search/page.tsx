import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogPage } from "@/app/_components/CatalogPage";
import { getSiteUrl } from "@/lib/site";
import { generateHreflangUrls } from "@/lib/locales";

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

  // SEO: Generate locale-aware canonical and hreflang URLs
  const hreflangUrls = generateHreflangUrls("/search", siteUrl);

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `${siteUrl}/${locale}/search`,
      languages: hreflangUrls,
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: `${siteUrl}/${locale}/search`,
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

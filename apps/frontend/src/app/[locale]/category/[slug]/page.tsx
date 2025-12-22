import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CatalogPage } from "@/app/_components/CatalogPage";
import { fetchCategories } from "@/lib/backend";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams?: Record<string, string | string[] | undefined>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, locale } = await props.params;

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

  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage(props: Props) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);

  return (
    <CatalogPage
      basePath={`/category/${slug}`}
      fixedCategorySlug={slug}
      searchParams={props.searchParams}
    />
  );
}

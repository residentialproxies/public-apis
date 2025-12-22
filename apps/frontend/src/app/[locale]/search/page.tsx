import { setRequestLocale } from "next-intl/server";
import { CatalogPage } from "@/app/_components/CatalogPage";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function Search({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CatalogPage basePath="/search" searchParams={searchParams} />;
}

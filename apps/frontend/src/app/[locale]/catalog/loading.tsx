import { BackendLoading } from "@/components/BackendLoading";
import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("common");
  return <BackendLoading message={t("loadingCatalog")} />;
}

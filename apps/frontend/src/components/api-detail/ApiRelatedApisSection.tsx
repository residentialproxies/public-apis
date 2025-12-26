import { Link } from "@/i18n/navigation";
import { slugify } from "@/lib/slugify";
import type { RelatedApisSectionProps } from "./types";

export function ApiRelatedApisSection({
  relatedApis,
  categoryName,
  t,
  tCategories,
}: RelatedApisSectionProps) {
  if (relatedApis.length === 0) {
    return null;
  }

  return (
    <section className="ui-surface mt-6 p-6">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">
        {categoryName
          ? t("moreIn", { category: tCategories(categoryName) })
          : t("moreInDefault")}
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
        {relatedApis.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3">
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
  );
}

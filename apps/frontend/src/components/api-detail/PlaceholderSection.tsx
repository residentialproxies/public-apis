import type { PlaceholderSectionProps } from "./types";

export function PlaceholderSection({
  title,
  icon,
  t,
}: PlaceholderSectionProps) {
  const getPlaceholderContent = () => {
    switch (title) {
      case "rateLimits":
        return {
          title: t("rateLimitsTitle"),
          desc: t("rateLimitsDesc"),
          rows: [
            { label: t("requestsPerMinute"), value: "–" },
            { label: t("dailyQuota"), value: "–" },
            { label: t("burstLimit"), value: "–" },
          ],
        };
      case "sdks":
        return {
          title: t("sdksTitle"),
          desc: t("sdksDesc"),
          rows: null,
          languages: ["Python", "JavaScript", "Ruby", "Go", "Java", "PHP"],
        };
      case "pricing":
        return {
          title: t("pricingTitle"),
          desc: t("pricingDesc"),
          rows: null,
          tiers: [
            { name: t("pricingFree"), desc: t("pricingBasic"), price: "$0" },
            { name: t("pricingPro"), desc: t("pricingEnhanced"), price: "–" },
            {
              name: t("pricingEnterprise"),
              desc: t("pricingCustom"),
              price: "–",
            },
          ],
        };
      default:
        return {
          title,
          desc: t("comingSoon"),
          rows: [],
        };
    }
  };

  const content = getPlaceholderContent();

  return (
    <section className="ui-surface mt-6 p-6 border-2 border-dashed border-[var(--border-dim)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {icon} {content.title}
        </h2>
        <span className="text-xs bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)] px-2 py-1 rounded-full font-semibold">
          {t("comingSoon")}
        </span>
      </div>
      <p className="text-sm text-[var(--text-muted)]">{content.desc}</p>

      {title === "rateLimits" && content.rows && (
        <div className="mt-4 grid gap-2 opacity-50">
          {content.rows.map((row, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-[var(--text-muted)]">{row.label}</span>
              <span className="font-mono text-[var(--text-secondary)]">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {title === "sdks" && "languages" in content && (
        <div className="mt-4 flex flex-wrap gap-2 opacity-50">
          {(content.languages as string[]).map((lang) => (
            <div
              key={lang}
              className="flex items-center gap-2 rounded-lg bg-[var(--bg-secondary)] px-3 py-2 border border-[var(--border-dim)]"
            >
              <svg
                className="h-4 w-4 text-[var(--text-muted)]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs text-[var(--text-secondary)]">
                {lang}
              </span>
            </div>
          ))}
        </div>
      )}

      {title === "pricing" && "tiers" in content && (
        <div className="mt-4 grid md:grid-cols-3 gap-3 opacity-50">
          {(
            content.tiers as Array<{
              name: string;
              desc: string;
              price: string;
            }>
          ).map((tier, idx) => (
            <div
              key={idx}
              className="rounded-lg bg-[var(--bg-secondary)] p-4 border border-[var(--border-dim)]"
            >
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                {tier.name}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                {tier.desc}
              </div>
              <div className="mt-2 text-lg font-bold text-[var(--text-primary)]">
                {tier.price}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

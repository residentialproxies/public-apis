import { Link } from "@/i18n/navigation";
import { TerminalWindow } from "@/components/TerminalWindow";
import type { PublicCategory } from "@/lib/backend";

const categoryIcons: Record<string, string> = {
  animals: "🐾",
  anime: "🎌",
  "anti-malware": "🛡️",
  art: "🎨",
  authentication: "🔐",
  blockchain: "⛓️",
  books: "📚",
  business: "💼",
  calendar: "📅",
  "cloud-storage": "☁️",
  "continuous-integration": "🔄",
  cryptocurrency: "💰",
  currency: "💱",
  "data-validation": "✅",
  development: "💻",
  dictionaries: "📖",
  documents: "📄",
  email: "📧",
  entertainment: "🎭",
  environment: "🌍",
  events: "🎪",
  finance: "📈",
  food: "🍔",
  games: "🎮",
  geocoding: "📍",
  government: "🏛️",
  health: "❤️",
  jobs: "💼",
  machine: "🤖",
  music: "🎵",
  news: "📰",
  "open-data": "📊",
  "open-source": "🔓",
  "patent-trademark": "™️",
  personality: "🧠",
  "phone-number": "📱",
  photography: "📷",
  "programming-languages": "⚙️",
  science: "🔬",
  security: "🔒",
  shopping: "🛒",
  social: "👥",
  sports: "⚽",
  "test-data": "🧪",
  "text-analysis": "📝",
  tracking: "📦",
  transportation: "🚗",
  "url-shorteners": "🔗",
  vehicle: "🚙",
  video: "🎬",
  weather: "🌤️",
};

function getCategoryIcon(slug: string): string {
  return categoryIcons[slug.toLowerCase()] || "📁";
}

interface CatalogFiltersProps {
  categories: PublicCategory[];
  t: (key: string) => string;
  tCategories: (key: string) => string;
  tCatalogPage: (key: string) => string;
}

export function CatalogFilters({
  categories,
  t,
  tCategories,
  tCatalogPage,
}: CatalogFiltersProps) {
  const sortedCategories = [...categories].sort(
    (a, b) => b.apiCount - a.apiCount,
  );
  const topCategories = sortedCategories.slice(0, 10);
  const maxApiCount = sortedCategories[0]?.apiCount || 1;

  return (
    <>
      <section className="mt-6">
        <TerminalWindow title={tCatalogPage("categoriesJson")}>
          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="group terminal-surface-muted p-4 transition-all hover:border-[var(--accent-green)]/50 hover:bg-[var(--bg-tertiary)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getCategoryIcon(category.slug)}
                      </span>
                      <div>
                        <h3 className="font-mono text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-green)]">
                          {tCategories(category.name)}
                        </h3>
                        <p className="font-mono text-xs text-[var(--text-dim)]">
                          {category.apiCount} {t("apis")}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-[var(--text-dim)] opacity-0 transition-opacity group-hover:opacity-100">
                      →
                    </span>
                  </div>

                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--bg-primary)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent-green)]/60 transition-all group-hover:bg-[var(--accent-green)]"
                      style={{
                        width: `${Math.min(100, (category.apiCount / maxApiCount) * 100)}%`,
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </TerminalWindow>
      </section>

      <section className="mt-6">
        <TerminalWindow title={tCatalogPage("popularCategoriesSh")}>
          <div className="p-4">
            <p className="mb-4 font-mono text-sm text-[var(--text-muted)]">
              <span className="text-[var(--accent-cyan)]">$</span>{" "}
              {tCatalogPage("topCategoriesDesc")}
            </p>
            <div className="space-y-2">
              {topCategories.map((category, index) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="group flex items-center justify-between rounded px-3 py-2 font-mono text-sm transition-all hover:bg-[var(--bg-tertiary)]"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[var(--accent-cyan)]">
                      [{String(index + 1).padStart(2, "0")}]
                    </span>
                    <span className="text-lg">
                      {getCategoryIcon(category.slug)}
                    </span>
                    <span className="text-[var(--text-primary)] group-hover:text-[var(--accent-green)]">
                      {tCategories(category.name)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-[var(--accent-green)]">
                      {category.apiCount}
                    </span>
                    <span className="text-[var(--text-dim)]">{t("apis")}</span>
                    <span className="text-[var(--text-dim)] opacity-0 transition-opacity group-hover:opacity-100">
                      →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </TerminalWindow>
      </section>
    </>
  );
}

import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

import { ApiThumbnail } from "@/components/ApiThumbnail";
import { StatusPill } from "@/components/StatusPill";
import { fetchApisList, fetchCategories, fetchFacets } from "@/lib/backend";
import { fetchPublicApisRepoStats, fallbackRepoStats } from "@/lib/github";
import { formatCompactNumber } from "@/lib/format";
import { getSiteUrl, SITE_NAME } from "@/lib/site";
import {
  buildHref,
  firstParam,
  parseCommaParam,
  toggleCommaValue,
} from "@/lib/search-params";
import { slugify } from "@/lib/slugify";

type Props = {
  basePath: string;
  fixedCategorySlug?: string;
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

const TerminalWindow = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="terminal-surface overflow-hidden">
    <div className="terminal-header rounded-t-lg">
      <div className="flex items-center gap-1.5">
        <span className="terminal-dot terminal-dot-red" />
        <span className="terminal-dot terminal-dot-yellow" />
        <span className="terminal-dot terminal-dot-green" />
      </div>
      <span className="ml-3 font-mono text-xs text-[var(--text-muted)]">
        {title}
      </span>
    </div>
    {children}
  </div>
);

export async function CatalogPage({
  basePath,
  fixedCategorySlug,
  searchParams = {},
}: Props) {
  const resolvedSearchParams = await searchParams;

  const q = firstParam(resolvedSearchParams.q);
  const category =
    fixedCategorySlug ?? firstParam(resolvedSearchParams.category);
  const auth = firstParam(resolvedSearchParams.auth);
  const cors = firstParam(resolvedSearchParams.cors);
  const healthStatus = firstParam(resolvedSearchParams.healthStatus);
  const https = firstParam(resolvedSearchParams.https);
  const sort = firstParam(resolvedSearchParams.sort) ?? "-popularityScore";
  const page = firstParam(resolvedSearchParams.page) ?? "1";
  const limit = firstParam(resolvedSearchParams.limit) ?? "20";

  const query = {
    q,
    category,
    auth,
    cors,
    healthStatus,
    https,
    sort,
    page,
    limit,
  };

  // Get translations
  const t = await getTranslations("catalog");
  const tHome = await getTranslations("home");
  const tCategories = await getTranslations("categories");

  let categories: Awaited<ReturnType<typeof fetchCategories>>;
  let facets: Awaited<ReturnType<typeof fetchFacets>>;
  let apis: Awaited<ReturnType<typeof fetchApisList>>;
  let repoStats: Awaited<ReturnType<typeof fetchPublicApisRepoStats>> =
    fallbackRepoStats();

  try {
    [categories, facets, apis, repoStats] = await Promise.all([
      fetchCategories(),
      fetchFacets(query),
      fetchApisList(query),
      fetchPublicApisRepoStats().catch(() => fallbackRepoStats()),
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <TerminalWindow title={t("errorTitle")}>
          <div className="p-6">
            <div className="font-mono text-sm">
              <span className="text-[var(--accent-red)]">ERROR</span>
              <span className="text-[var(--text-muted)]">:</span>
              <span className="ml-2 text-[var(--text-primary)]">
                {t("errorMessage")}
              </span>
            </div>
            <p className="mt-2 font-mono text-sm text-[var(--text-muted)]">
              <span className="text-[var(--accent-cyan)]">$</span>{" "}
              {t("errorDesc")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                className="terminal-btn terminal-btn-primary"
                href={basePath}
              >
                <span className="text-[var(--bg-primary)]">{t("retry")}</span>
              </Link>
              <Link
                className="terminal-btn terminal-btn-secondary"
                href="/about"
              >
                <span>{t("help")}</span>
              </Link>
            </div>

            {process.env.NODE_ENV !== "production" ? (
              <div className="mt-6 rounded border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/5 p-4 font-mono text-xs">
                <div className="text-[var(--accent-red)]">// Debug Output</div>
                <pre className="mt-2 whitespace-pre-wrap break-words text-[var(--text-muted)]">
                  {errorMessage}
                </pre>
              </div>
            ) : null}
          </div>
        </TerminalWindow>
      </main>
    );
  }

  const selectedAuth = new Set(parseCommaParam(auth));
  const selectedCors = new Set(parseCommaParam(cors));
  const selectedHealth = new Set(parseCommaParam(healthStatus));

  const categoryName = category
    ? categories.find((c) => c.slug === category)?.name
    : undefined;
  const categoryLabel = categoryName ? tCategories(categoryName) : undefined;

  const makeHref = (patch: Partial<typeof query>) =>
    buildHref(basePath, {
      ...query,
      ...patch,
      page:
        patch.page ??
        (patch.q ||
        patch.category ||
        patch.auth ||
        patch.cors ||
        patch.healthStatus ||
        patch.https
          ? "1"
          : query.page),
    });

  const toggle = (key: "auth" | "cors" | "healthStatus", value: string) => {
    const nextValue = toggleCommaValue(query[key], value);
    return makeHref({ [key]: nextValue } as Partial<typeof query>);
  };

  const heroTitle = fixedCategorySlug
    ? t("categoryTitle", { category: categoryLabel ?? "Public API" })
    : t("title");

  const heroSubtitle = fixedCategorySlug
    ? t("categorySubtitle", { category: categoryLabel ?? fixedCategorySlug })
    : t("subtitle");

  const latestSync =
    categories
      .map((c) => c.lastSyncedAt)
      .filter((v): v is string => !!v)
      .sort()
      .at(-1) ?? null;

  const stats = {
    totalApis: apis.totalDocs,
    categories: categories.length,
    stars: repoStats.stars,
    forks: repoStats.forks,
    openIssues: repoStats.openIssues,
    lastSync: latestSync,
  };

  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: heroTitle,
    description: heroSubtitle,
    url: `${siteUrl}${basePath === "/" ? "" : basePath}`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: siteUrl },
    numberOfItems: apis.totalDocs,
    about: categories.slice(0, 12).map((c) => c.name),
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: Math.min(apis.totalDocs, apis.docs.length),
      itemListElement: apis.docs.slice(0, 10).map((api, idx) => ({
        "@type": "WebAPI",
        name: api.name,
        url: `${siteUrl}/api/${api.id}/${slugify(api.name)}`,
        position: idx + 1,
        category: api.category?.name,
        documentation: api.link,
      })),
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}${basePath}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Hero Section - Terminal Style */}
      <section className="terminal-surface-elevated p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="font-mono text-2xl font-bold text-[var(--text-primary)] glow-text">
              <span className="text-[var(--accent-cyan)]">$</span> {heroTitle}
              <span className="ml-2 inline-block h-6 w-3 animate-[blink_1s_infinite] bg-[var(--accent-green)]" />
            </h1>
            <p className="mt-2 max-w-xl font-mono text-sm text-[var(--text-muted)]">
              <span className="text-[var(--accent-purple)]">//</span>{" "}
              {heroSubtitle.replace(/'/g, "'")}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="terminal-surface-muted p-3 text-center">
              <div className="font-mono text-lg font-bold text-[var(--accent-green)]">
                {stats.totalApis.toLocaleString()}
              </div>
              <div className="font-mono text-xs text-[var(--text-dim)]">
                {t("apis")}
              </div>
            </div>
            <div className="terminal-surface-muted p-3 text-center">
              <div className="font-mono text-lg font-bold text-[var(--accent-cyan)]">
                {stats.categories}
              </div>
              <div className="font-mono text-xs text-[var(--text-dim)]">
                {tHome("categories")}
              </div>
            </div>
            <div className="terminal-surface-muted p-3 text-center">
              <div className="font-mono text-lg font-bold text-[var(--accent-yellow)]">
                {formatCompactNumber(stats.stars) ?? "—"}
              </div>
              <div className="font-mono text-xs text-[var(--text-dim)]">
                {t("stars")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="terminal-surface mt-4">
        <div className="terminal-header rounded-t-lg">
          <span className="font-mono text-xs text-[var(--accent-green)]">
            search
          </span>
          <span className="font-mono text-xs text-[var(--text-dim)]">.sh</span>
        </div>
        <div className="p-4">
          <form
            action={basePath}
            method="get"
            role="search"
            aria-label="Search and filter APIs"
            className="flex flex-col gap-3 md:flex-row md:items-end"
          >
            <div className="flex-1">
              <label className="sr-only" htmlFor="q">
                Search
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[var(--accent-cyan)]">
                  grep
                </span>
                <input
                  id="q"
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder={t("searchPlaceholder")}
                  className="terminal-input pl-14"
                />
              </div>
            </div>

            {!fixedCategorySlug ? (
              <div className="w-full md:w-48">
                <label className="sr-only" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  defaultValue={category ?? ""}
                  className="terminal-select"
                >
                  <option value="">{t("allCategories")}</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {tCategories(c.name)} ({c.apiCount})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 font-mono text-sm text-[var(--text-muted)]">
                <span className="text-[var(--accent-purple)]">@</span>
                <span>{categoryLabel ?? fixedCategorySlug}</span>
                <Link
                  className="text-[var(--accent-green)] hover:underline"
                  href="/"
                >
                  {t("change")}
                </Link>
              </div>
            )}

            <div className="w-full md:w-40">
              <label className="sr-only" htmlFor="sort">
                Sort
              </label>
              <select
                id="sort"
                name="sort"
                defaultValue={sort}
                className="terminal-select"
              >
                <option value="-popularityScore">{t("sortPopular")}</option>
                <option value="-lastCheckedAt">{t("sortRecent")}</option>
                <option value="name">{t("sortAZ")}</option>
                <option value="-name">{t("sortZA")}</option>
              </select>
            </div>

            <button type="submit" className="terminal-btn terminal-btn-primary">
              <span className="text-[var(--bg-primary)]">./run</span>
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-sm">
            <p
              aria-live="polite"
              aria-atomic="true"
              className="text-[var(--text-muted)]"
            >
              <span className="text-[var(--accent-green)]">&gt;</span> Found{" "}
              <span className="text-[var(--accent-cyan)]">
                {apis.totalDocs.toLocaleString()}
              </span>{" "}
              results
              {q ? (
                <>
                  {" "}
                  for{" "}
                  <span className="text-[var(--accent-yellow)]">
                    &quot;{q}&quot;
                  </span>
                </>
              ) : null}
            </p>

            {(q || auth || cors || healthStatus || https) && (
              <Link
                className="text-[var(--accent-red)] hover:underline"
                href={makeHref({
                  q: undefined,
                  category: fixedCategorySlug ? category : undefined,
                  auth: undefined,
                  cors: undefined,
                  healthStatus: undefined,
                  https: undefined,
                  page: "1",
                })}
              >
                [clear filters]
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-12">
        {/* Filters Sidebar */}
        <aside className="md:col-span-4 lg:col-span-3">
          <div className="sticky top-32 space-y-3">
            {/* Auth Filter */}
            <TerminalWindow title="filter --auth">
              <div className="p-3">
                <ul
                  className="space-y-1 font-mono text-sm"
                  role="list"
                  aria-label="Filter by authentication type"
                >
                  {Object.entries(facets.auth).map(([key, count]) => (
                    <li key={key}>
                      <Link
                        href={toggle("auth", key)}
                        aria-pressed={selectedAuth.has(key)}
                        aria-label={`Filter by ${key} authentication (${count} APIs)`}
                        className={`flex items-center justify-between rounded px-2 py-1.5 transition-all ${
                          selectedAuth.has(key)
                            ? "bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/30"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-[var(--accent-cyan)]">
                            {selectedAuth.has(key) ? "✓" : "○"}
                          </span>
                          <span className="truncate">{key}</span>
                        </span>
                        <span className="text-xs text-[var(--text-dim)]">
                          {count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </TerminalWindow>

            {/* CORS Filter */}
            <TerminalWindow title="filter --cors">
              <div className="p-3">
                <ul
                  className="space-y-1 font-mono text-sm"
                  role="list"
                  aria-label="Filter by CORS support"
                >
                  {Object.entries(facets.cors).map(([key, count]) => (
                    <li key={key}>
                      <Link
                        href={toggle("cors", key)}
                        aria-pressed={selectedCors.has(key)}
                        aria-label={`Filter by CORS ${key} (${count} APIs)`}
                        className={`flex items-center justify-between rounded px-2 py-1.5 transition-all ${
                          selectedCors.has(key)
                            ? "bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-[var(--accent-purple)]">
                            {selectedCors.has(key) ? "✓" : "○"}
                          </span>
                          <span className="truncate">{key}</span>
                        </span>
                        <span className="text-xs text-[var(--text-dim)]">
                          {count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </TerminalWindow>

            {/* Status Filter */}
            <TerminalWindow title="filter --status">
              <div className="p-3">
                <ul
                  className="space-y-1 font-mono text-sm"
                  role="list"
                  aria-label="Filter by health status"
                >
                  {Object.entries(facets.healthStatus).map(([key, count]) => (
                    <li key={key}>
                      <Link
                        href={toggle("healthStatus", key)}
                        aria-pressed={selectedHealth.has(key)}
                        aria-label={`Filter by ${key} status (${count} APIs)`}
                        className={`flex items-center justify-between rounded px-2 py-1.5 transition-all ${
                          selectedHealth.has(key)
                            ? "bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] border border-[var(--accent-orange)]/30"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-[var(--accent-pink)]">
                            {selectedHealth.has(key) ? "✓" : "○"}
                          </span>
                          <span className="truncate">{key}</span>
                        </span>
                        <span className="text-xs text-[var(--text-dim)]">
                          {count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </TerminalWindow>

            {/* HTTPS Filter */}
            <TerminalWindow title="filter --https">
              <div className="p-3">
                <div
                  className="flex gap-1 font-mono text-sm"
                  role="group"
                  aria-label="Filter by HTTPS support"
                >
                  {[
                    { value: undefined, label: "ANY" },
                    { value: "true", label: "YES" },
                    { value: "false", label: "NO" },
                  ].map((opt) => (
                    <Link
                      key={opt.label}
                      href={makeHref({ https: opt.value })}
                      aria-pressed={https === opt.value}
                      className={`flex-1 rounded px-3 py-2 text-center transition-all ${
                        https === opt.value
                          ? "bg-[var(--accent-green)] text-[var(--bg-primary)] font-medium"
                          : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {opt.label}
                    </Link>
                  ))}
                </div>
              </div>
            </TerminalWindow>
          </div>
        </aside>

        {/* API List */}
        <section className="md:col-span-8 lg:col-span-9">
          {apis.docs.length === 0 ? (
            <TerminalWindow title="results.txt">
              <div className="p-6 text-center">
                <div className="font-mono text-sm text-[var(--text-muted)]">
                  <span className="text-[var(--accent-yellow)]">WARN</span>:{" "}
                  {q ? (
                    <>No APIs match &quot;{q}&quot;. Try different keywords.</>
                  ) : (
                    <>No APIs match your filters.</>
                  )}
                </div>
                <Link
                  className="mt-3 inline-block font-mono text-sm text-[var(--accent-green)] hover:underline"
                  href={makeHref({
                    q: undefined,
                    category: fixedCategorySlug ? category : undefined,
                    auth: undefined,
                    cors: undefined,
                    healthStatus: undefined,
                    https: undefined,
                    page: "1",
                  })}
                >
                  [reset filters]
                </Link>
              </div>
            </TerminalWindow>
          ) : (
            <>
              <ul className="space-y-2" aria-label="API list">
                {apis.docs.map((api, index) => {
                  const href = `/api/${api.id}/${slugify(api.name)}`;
                  return (
                    <li
                      key={api.id}
                      className="terminal-surface group overflow-hidden transition-all duration-200 hover:border-[var(--accent-green)]/50"
                    >
                      <div className="p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          {/* Screenshot thumbnail */}
                          <div className="shrink-0 sm:order-2 sm:w-32">
                            <ApiThumbnail apiId={api.id} apiName={api.name} />
                          </div>

                          <div className="min-w-0 flex-1 sm:order-1">
                            <Link
                              href={href}
                              className="group/link flex items-center gap-2 font-mono text-base font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--accent-green)]"
                            >
                              <span className="text-[var(--accent-cyan)] opacity-60 transition-opacity group-hover/link:opacity-100">
                                [{String(index + 1).padStart(2, "0")}]
                              </span>
                              {api.name}
                              <span className="text-[var(--text-dim)] opacity-0 transition-opacity group-hover/link:opacity-100">
                                →
                              </span>
                            </Link>
                            <p className="mt-1 line-clamp-2 font-mono text-sm text-[var(--text-muted)]">
                              {api.description}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              {api.category ? (
                                <Link
                                  href={buildHref(
                                    `/category/${api.category.slug}`,
                                    { q, auth, cors, healthStatus, https },
                                  )}
                                  className="terminal-chip terminal-chip-purple"
                                >
                                  @{tCategories(api.category.name)}
                                </Link>
                              ) : null}
                              <span className="terminal-chip terminal-chip-cyan">
                                {api.auth}
                              </span>
                              <span className="terminal-chip terminal-chip-orange">
                                CORS:{api.cors}
                              </span>
                              {api.https && (
                                <span className="terminal-chip">HTTPS</span>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                            <StatusPill status={api.healthStatus} />
                            {api.latencyMs !== null && (
                              <div className="font-mono text-xs text-[var(--text-dim)]">
                                <span className="text-[var(--accent-cyan)]">
                                  {api.latencyMs}
                                </span>
                                ms
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Pagination */}
              {apis.totalPages > 1 ? (
                <nav
                  aria-label="Pagination"
                  className="mt-4 terminal-surface p-4"
                >
                  <div className="flex items-center justify-between font-mono text-sm">
                    <span className="text-[var(--text-muted)]">
                      <span className="text-[var(--accent-green)]">[</span>
                      Page {apis.page}/{apis.totalPages}
                      <span className="text-[var(--accent-green)]">]</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {apis.hasPrevPage ? (
                        <Link
                          rel="prev"
                          aria-label="Previous page"
                          className="rounded px-3 py-1.5 text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-green)]"
                          href={makeHref({ page: String(apis.prevPage ?? 1) })}
                        >
                          &lt;prev
                        </Link>
                      ) : (
                        <span className="rounded px-3 py-1.5 text-[var(--text-dim)]">
                          &lt;prev
                        </span>
                      )}

                      {(() => {
                        const pages: (number | "ellipsis")[] = [];
                        const current = apis.page;
                        const total = apis.totalPages;

                        if (total <= 5) {
                          for (let i = 1; i <= total; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          if (current > 3) pages.push("ellipsis");
                          for (
                            let i = Math.max(2, current - 1);
                            i <= Math.min(total - 1, current + 1);
                            i++
                          ) {
                            pages.push(i);
                          }
                          if (current < total - 2) pages.push("ellipsis");
                          pages.push(total);
                        }

                        return pages.map((p, idx) =>
                          p === "ellipsis" ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-1 text-[var(--text-dim)]"
                            >
                              ...
                            </span>
                          ) : (
                            <Link
                              key={p}
                              href={makeHref({ page: String(p) })}
                              aria-label={`Page ${p}`}
                              aria-current={p === current ? "page" : undefined}
                              className={`rounded px-3 py-1.5 transition-all ${
                                p === current
                                  ? "bg-[var(--accent-green)] text-[var(--bg-primary)] font-medium"
                                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-green)]"
                              }`}
                            >
                              {p}
                            </Link>
                          ),
                        );
                      })()}

                      {apis.hasNextPage ? (
                        <Link
                          rel="next"
                          aria-label="Next page"
                          className="rounded px-3 py-1.5 text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-green)]"
                          href={makeHref({
                            page: String(apis.nextPage ?? apis.page),
                          })}
                        >
                          next&gt;
                        </Link>
                      ) : (
                        <span className="rounded px-3 py-1.5 text-[var(--text-dim)]">
                          next&gt;
                        </span>
                      )}
                    </div>
                  </div>
                </nav>
              ) : null}
            </>
          )}
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}

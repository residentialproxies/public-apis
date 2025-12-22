export type RepoStats = {
  stars: number | null;
  forks: number | null;
  openIssues: number | null;
  pushedAt: string | null;
  url: string;
};

const REPO_API_URL = "https://api.github.com/repos/public-apis/public-apis";
const REPO_HTML_URL = "https://github.com/public-apis/public-apis";

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = { Accept: "application/vnd.github+json" };
  const token =
    process.env.GITHUB_TOKEN ?? process.env.PUBLIC_APIS_GITHUB_TOKEN;
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}

export async function fetchPublicApisRepoStats(): Promise<RepoStats> {
  const res = await fetch(REPO_API_URL, {
    headers: buildHeaders(),
    next: { revalidate: 21_600 }, // 6 hours cache; freshness is good enough for SEO
  });

  if (!res.ok) {
    throw new Error(`GitHub repo fetch failed (${res.status})`);
  }

  const json = (await res.json()) as unknown;

  if (!json || typeof json !== "object") {
    throw new Error("Unexpected GitHub payload");
  }

  const data = json as {
    stargazers_count?: number;
    forks_count?: number;
    open_issues_count?: number;
    pushed_at?: string;
    updated_at?: string;
    html_url?: string;
  };

  return {
    stars:
      typeof data.stargazers_count === "number" ? data.stargazers_count : null,
    forks: typeof data.forks_count === "number" ? data.forks_count : null,
    openIssues:
      typeof data.open_issues_count === "number"
        ? data.open_issues_count
        : null,
    pushedAt:
      typeof data.pushed_at === "string"
        ? data.pushed_at
        : typeof data.updated_at === "string"
          ? data.updated_at
          : null,
    url:
      typeof data.html_url === "string" && data.html_url
        ? data.html_url
        : REPO_HTML_URL,
  };
}

export function fallbackRepoStats(): RepoStats {
  // Conservative defaults used only when GitHub is unreachable
  return {
    stars: null,
    forks: null,
    openIssues: null,
    pushedAt: null,
    url: REPO_HTML_URL,
  };
}

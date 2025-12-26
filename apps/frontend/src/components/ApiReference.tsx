"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

type Props = {
  apiId: number;
  cmsUrl: string;
  spec: Record<string, unknown>;
};

function ApiReferenceSkeleton() {
  const t = useTranslations("apiReference");
  return (
    <div className="ui-surface max-h-[800px] overflow-auto p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-4/6 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-8 flex-1 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-zinc-500">
        {t("loadingDocs")}
      </p>
    </div>
  );
}

const ApiReferenceReact = dynamic(
  () =>
    import("@scalar/api-reference-react").then((mod) => mod.ApiReferenceReact),
  {
    ssr: false,
    loading: () => <ApiReferenceSkeleton />,
  },
);

function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function ApiReference({ apiId, cmsUrl, spec }: Props) {
  const proxyUrl = new URL("/api/v1/public/proxy", cmsUrl).toString();

  return (
    <div className="ui-surface max-h-[800px] overflow-auto">
      <ApiReferenceReact
        configuration={{
          content: spec,
          theme: "kepler",
          showSidebar: true,
          isEditable: false,
          fetch: async (input, init) => {
            const request = new Request(input, init);
            const targetUrl = request.url;

            if (!isHttpUrl(targetUrl) || targetUrl.startsWith(proxyUrl)) {
              return fetch(request);
            }

            const headers: Record<string, string> = {};
            request.headers.forEach((value, key) => {
              headers[key] = value;
            });

            let body: string | undefined;
            if (request.method !== "GET" && request.method !== "HEAD") {
              try {
                const text = await request.text();
                body = text.length ? text : undefined;
              } catch {
                body = undefined;
              }
            }

            return fetch(proxyUrl, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                apiId,
                targetUrl,
                method: request.method,
                headers,
                body,
              }),
            });
          },
        }}
      />
    </div>
  );
}

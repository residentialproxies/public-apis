"use client";

import { useMemo, useState, useTransition } from "react";

import { CopyButton } from "@/components/CopyButton";

type Props = {
  apiId: number;
  cmsUrl: string;
  defaultUrl: string;
};

type TabKey = "curl" | "fetch" | "python" | "axios";

function safeParseJson(
  value: string,
): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function toHeaderLines(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([k, v]) => `-H ${JSON.stringify(`${k}: ${v}`)}`)
    .join(" ");
}

function buildCurl(args: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}) {
  const headerFlags = toHeaderLines(args.headers);
  const bodyFlag = args.body ? `--data ${JSON.stringify(args.body)}` : "";
  return `curl -X ${args.method} ${headerFlags} ${bodyFlag} ${JSON.stringify(args.url)}`
    .replace(/\s+/g, " ")
    .trim();
}

function buildFetch(args: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}) {
  const headers = JSON.stringify(args.headers, null, 2);
  const body = args.body ? `,\n  body: ${JSON.stringify(args.body)}` : "";
  return `await fetch(${JSON.stringify(args.url)}, {\n  method: ${JSON.stringify(args.method)},\n  headers: ${headers}${body}\n})`;
}

function buildPython(args: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}) {
  const headers = JSON.stringify(args.headers, null, 2);
  const data = args.body ? `data=${JSON.stringify(args.body)}` : "data=None";
  return `import requests\n\nres = requests.request(${JSON.stringify(args.method)}, ${JSON.stringify(args.url)}, headers=${headers}, ${data})\nprint(res.status_code)\nprint(res.text)`;
}

function buildAxios(args: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}) {
  const headers = JSON.stringify(args.headers, null, 2);
  const data = args.body ? `,\n  data: ${JSON.stringify(args.body)}` : "";
  return `import axios from 'axios'\n\nconst res = await axios({\n  url: ${JSON.stringify(args.url)},\n  method: ${JSON.stringify(args.method.toLowerCase())},\n  headers: ${headers}${data}\n})\nconsole.log(res.status)\nconsole.log(res.data)`;
}

export function ApiPlayground({ apiId, cmsUrl, defaultUrl }: Props) {
  const proxyUrl = new URL("/api/v1/public/proxy", cmsUrl).toString();

  const [method, setMethod] = useState("GET");
  const [targetUrl, setTargetUrl] = useState(defaultUrl);
  const [headersText, setHeadersText] = useState(
    '{\n  "accept": "application/json"\n}',
  );
  const [bodyText, setBodyText] = useState("");
  const [tab, setTab] = useState<TabKey>("curl");

  const [response, setResponse] = useState<{
    status: number;
    contentType: string | null;
    body: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const headersParsed = useMemo(() => {
    const parsed = safeParseJson(headersText);
    if (!parsed.ok) return parsed;
    if (
      !parsed.value ||
      typeof parsed.value !== "object" ||
      Array.isArray(parsed.value)
    ) {
      return { ok: false as const, error: "Headers must be a JSON object" };
    }
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(
      parsed.value as Record<string, unknown>,
    )) {
      if (typeof v === "string") out[k] = v;
    }
    return { ok: true as const, value: out };
  }, [headersText]);

  const snippetInput = useMemo(() => {
    const headers = headersParsed.ok ? headersParsed.value : {};
    const body = bodyText.trim() ? bodyText : undefined;
    return { method, url: targetUrl, headers, body };
  }, [bodyText, headersParsed, method, targetUrl]);

  const snippet = useMemo(() => {
    switch (tab) {
      case "fetch":
        return buildFetch(snippetInput);
      case "python":
        return buildPython(snippetInput);
      case "axios":
        return buildAxios(snippetInput);
      case "curl":
      default:
        return buildCurl(snippetInput);
    }
  }, [snippetInput, tab]);

  const onSend = () => {
    setError(null);
    setResponse(null);

    if (!targetUrl.trim()) {
      setError("Target URL is required.");
      return;
    }

    if (!headersParsed.ok) {
      setError(`Invalid headers JSON: ${headersParsed.error}`);
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(proxyUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            apiId,
            targetUrl: targetUrl.trim(),
            method,
            headers: headersParsed.value,
            body: bodyText.trim() ? bodyText : undefined,
          }),
        });

        const contentType = res.headers.get("content-type");
        const raw = await res.text();

        let body = raw;
        if (contentType?.includes("application/json")) {
          const parsed = safeParseJson(raw);
          if (parsed.ok) body = JSON.stringify(parsed.value, null, 2);
        }

        setResponse({ status: res.status, contentType, body });
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
      }
    });
  };

  const tabClass = (key: TabKey) =>
    `rounded-lg border px-3 py-1.5 text-sm ${
      tab === key
        ? "border-zinc-900 bg-zinc-900 text-white"
        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
    }`;

  return (
    <section className="ui-surface mt-6 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Playground</h2>
        <p className="text-xs text-zinc-500">
          Requests are sent via the built-in proxy (SSRF-guarded, host allowlist
          per API).
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-3 md:grid-cols-6 md:items-end">
          <div className="md:col-span-1">
            <label
              className="text-sm font-medium text-zinc-800"
              htmlFor="method"
            >
              Method
            </label>
            <select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="ui-select mt-1"
            >
              {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-5">
            <label
              className="text-sm font-medium text-zinc-800"
              htmlFor="targetUrl"
            >
              Target URL
            </label>
            <input
              id="targetUrl"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://api.example.com/v1/…"
              className="ui-input mt-1"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label
              className="text-sm font-medium text-zinc-800"
              htmlFor="headers"
            >
              Headers (JSON)
            </label>
            <textarea
              id="headers"
              value={headersText}
              onChange={(e) => setHeadersText(e.target.value)}
              rows={6}
              className="ui-input mt-1 py-3 font-mono"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-800" htmlFor="body">
              Body (raw)
            </label>
            <textarea
              id="body"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={6}
              className="ui-input mt-1 py-3 font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSend}
              disabled={isPending}
              className={`ui-btn ${isPending ? "ui-btn-secondary" : "ui-btn-primary"}`}
            >
              {isPending ? "Sending…" : "Send"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton label="Copy curl" value={buildCurl(snippetInput)} />
            <CopyButton label="Copy URL" value={targetUrl} />
          </div>
        </div>

        <div className="ui-surface-muted p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label="Code snippet language"
              className="flex flex-wrap gap-2"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "curl"}
                className={tabClass("curl")}
                onClick={() => setTab("curl")}
              >
                cURL
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "fetch"}
                className={tabClass("fetch")}
                onClick={() => setTab("fetch")}
              >
                Fetch
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "python"}
                className={tabClass("python")}
                onClick={() => setTab("python")}
              >
                Python
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "axios"}
                className={tabClass("axios")}
                onClick={() => setTab("axios")}
              >
                Axios
              </button>
            </div>

            <CopyButton
              label="Copy snippet"
              value={snippet}
              className="ui-btn ui-btn-secondary px-3 py-1.5"
            />
          </div>

          <pre
            role="tabpanel"
            aria-label={`${tab} code snippet`}
            className="mt-3 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-zinc-800"
          >
            {snippet}
          </pre>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </div>
        ) : null}

        <div aria-live="polite" aria-atomic="true">
          {response ? (
            <div className="ui-surface-muted p-4">
              <div className="flex flex-col gap-1 text-sm text-zinc-700 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="font-semibold text-zinc-900">Status:</span>{" "}
                  {response.status}
                  {response.contentType ? (
                    <span className="ml-2 text-xs text-zinc-500">
                      ({response.contentType})
                    </span>
                  ) : null}
                </div>
                <CopyButton
                  label="Copy response"
                  value={response.body}
                  className="ui-btn ui-btn-secondary px-3 py-1.5"
                />
              </div>
              <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-zinc-800">
                {response.body}
              </pre>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

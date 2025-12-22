"use client";

import dynamic from "next/dynamic";

type Props = {
  apiId: number;
  cmsUrl: string;
  defaultUrl: string;
};

function ApiPlaygroundSkeleton() {
  return (
    <section className="ui-surface mt-6 p-6">
      <div className="animate-pulse">
        <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="h-10 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-10 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="mt-4 h-32 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <p className="mt-4 text-center text-sm text-zinc-500">
        Loading playground...
      </p>
    </section>
  );
}

const ApiPlayground = dynamic(
  () => import("@/components/ApiPlayground").then((mod) => mod.ApiPlayground),
  {
    ssr: false,
    loading: () => <ApiPlaygroundSkeleton />,
  },
);

export function ApiPlaygroundLazy({ apiId, cmsUrl, defaultUrl }: Props) {
  return (
    <ApiPlayground apiId={apiId} cmsUrl={cmsUrl} defaultUrl={defaultUrl} />
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { slugify } from "@/lib/slugify";

interface Props {
  apiId: string | number;
  apiName: string;
  thumbnailUrl?: string | null;
  slug?: string;
}

// Base64 encoded blur placeholder
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9Ijc1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMyMDIwMjAiLz48L3N2Zz4=";

export function ApiThumbnail({ apiId, apiName, thumbnailUrl, slug }: Props) {
  const t = useTranslations("thumbnail");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use provided URL or fallback to slug-based path
  // Prefer provided slug, otherwise generate from apiName
  const apiSlug = slug || slugify(apiName);
  const src = thumbnailUrl ?? `/screenshots/${apiSlug}.webp`;

  if (error) {
    // Return placeholder when image fails to load
    return (
      <div className="flex h-18 w-full items-center justify-center rounded border border-[var(--border-dim)] bg-[var(--bg-tertiary)] sm:h-20">
        <svg
          className="h-6 w-6 text-[var(--text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative h-18 w-full overflow-hidden rounded border border-[var(--border-dim)] sm:h-20">
      <Image
        src={src}
        alt={t("alt", { name: apiName })}
        fill
        className={`object-cover transition-opacity duration-200 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
        sizes="(max-width: 640px) 100vw, 200px"
        loading="lazy"
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
        unoptimized={src.startsWith("/screenshots/")}
      />
      {loading && (
        <div className="absolute inset-0 animate-pulse bg-[var(--bg-tertiary)]" />
      )}
    </div>
  );
}

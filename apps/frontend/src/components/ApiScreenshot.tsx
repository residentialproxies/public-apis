"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

type ApiScreenshotProps = {
  thumbnailUrl?: string | null;
  fullUrl?: string | null;
  apiName: string;
  capturedAt?: string | null;
};

// Base64 encoded blur placeholder (gray gradient)
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMWExYTFhIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMmEyYTJhIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==";

/**
 * ApiScreenshot component
 * Displays API documentation screenshot with click-to-enlarge functionality
 *
 * Features:
 * - Thumbnail display with hover effects
 * - Full-screen modal on click
 * - Graceful error handling with fallback UI
 * - Accessibility support
 * - Performance optimized with Next.js Image
 * - Blur placeholder for smooth loading
 * - Keyboard navigation support
 */
export function ApiScreenshot({
  thumbnailUrl,
  fullUrl,
  apiName,
  capturedAt,
}: ApiScreenshotProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsModalOpen(false);
    }
  }, []);

  // If no screenshot or error occurred, show fallback UI
  if (!thumbnailUrl || imageError) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[var(--border-dim)] bg-[var(--bg-tertiary)] p-8 text-sm text-[var(--text-muted)]">
        <svg
          className="mr-2 h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Screenshot not available
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail with click-to-enlarge */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="group relative block w-full cursor-pointer overflow-hidden rounded-xl border border-[var(--border-dim)] transition-all hover:shadow-[var(--glow-green)]"
          aria-label={`View full screenshot of ${apiName}`}
        >
          <Image
            src={thumbnailUrl}
            alt={`${apiName} documentation screenshot`}
            width={400}
            height={300}
            className={`h-auto w-full object-cover transition-all duration-300 group-hover:opacity-90 ${
              isLoading ? "scale-105 blur-sm" : "scale-100 blur-0"
            }`}
            onError={() => setImageError(true)}
            onLoad={() => setIsLoading(false)}
            loading="lazy"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            sizes="(max-width: 768px) 100vw, 400px"
          />

          {/* Hover overlay with "Click to enlarge" hint */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
            <div className="rounded-lg bg-[var(--bg-elevated)] px-3 py-1.5 text-sm font-medium text-[var(--accent-green)] shadow-lg border border-[var(--border-active)]">
              <svg
                className="mr-1.5 inline-block h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
              Click to enlarge
            </div>
          </div>
        </button>

        {/* Screenshot metadata */}
        {capturedAt && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Captured{" "}
            {new Date(capturedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Full-screen modal */}
      {isModalOpen && fullUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot modal"
          tabIndex={0}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(false);
              }}
              className="absolute -right-2 -top-2 z-10 rounded-full bg-[var(--bg-elevated)] p-2 shadow-lg border border-[var(--border-active)] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)]"
              aria-label="Close screenshot"
            >
              <svg
                className="h-6 w-6 text-[var(--accent-green)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Full-size image */}
            <Image
              src={fullUrl}
              alt={`${apiName} full documentation screenshot`}
              width={1280}
              height={720}
              className="rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              priority
              sizes="90vw"
              quality={90}
            />

            {/* Screenshot info */}
            <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-sm font-medium text-white">{apiName}</p>
              {capturedAt && (
                <p className="text-xs text-white/80">
                  Captured{" "}
                  {new Date(capturedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Skeleton loader for ApiScreenshot
 * Displayed while screenshot is loading
 */
export function ApiScreenshotSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[300px] w-full rounded-xl bg-[var(--bg-tertiary)]"></div>
      <div className="mt-2 h-4 w-24 rounded bg-[var(--bg-tertiary)]"></div>
    </div>
  );
}

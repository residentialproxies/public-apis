import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Shared packages
  transpilePackages: ["@api-navigator/shared"],

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "screenshots.api-navigator.com",
        pathname: "/**",
      },
      // For local development or alternative CDN configurations
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      // Local development - proxy to backend
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/screenshots/**",
      },
    ],
    // Image optimization settings
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Experimental features for performance
  experimental: {
    // Turbopack configuration for monorepo
    // Note: turbo config moved to turbo.json in Next.js 16
    // turbo: {
    //   root: "../../",
    // },
    // Optimize package imports
    optimizePackageImports: [
      "@scalar/api-reference-react",
      "marked",
      "isomorphic-dompurify",
    ],
  },

  // Compiler options for production optimization
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },

  // Generate source maps only in development
  productionBrowserSourceMaps: false,

  // Compression
  compress: true,

  // Powered by header - disable for security
  poweredByHeader: false,

  // Strict mode for React
  reactStrictMode: true,

  // Headers for caching and security
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Security headers
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
      // Cache static assets
      {
        source: "/screenshots/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache fonts
      {
        source: "/:path*.woff2",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache images
      {
        source: "/:path*.(ico|png|jpg|jpeg|gif|webp|avif|svg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/screenshots/:path*",
        destination: `${process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3001"}/screenshots/:path*`,
      },
      // Redirect /api/:id/:slug to /en/api/:id/:slug (default locale)
      {
        source: "/api/:id(\\d+)/:slug",
        destination: "/en/api/:id/:slug",
      },
    ];
  },
};

export default withNextIntl(nextConfig);

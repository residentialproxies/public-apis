import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
// Temporarily disabled due to build-time font fetching issues
// import { Noto_Sans_JP } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import "../globals.css";
import "@scalar/api-reference-react/style.css";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_NAME, SITE_DESCRIPTION, getSiteUrl } from "@/lib/site";
import { locales, type Locale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { generateHreflangUrls, toLocalizedPath } from "@/lib/locales";

// Locale to OpenGraph locale mapping
const localeToOgLocale: Record<string, string> = {
  zh: "zh_CN",
  ja: "ja_JP",
  es: "es_ES",
  "pt-BR": "pt_BR",
  de: "de_DE",
  en: "en_US",
};

// Locale to HTML lang attribute mapping
const localeToLang: Record<string, string> = {
  zh: "zh-CN",
  ja: "ja-JP",
  es: "es-ES",
  "pt-BR": "pt-BR",
  de: "de-DE",
  en: "en-US",
};

// Skip to content translations
const skipToContentText: Record<string, string> = {
  zh: "跳到主要内容",
  ja: "メインコンテンツへスキップ",
  es: "Saltar al contenido principal",
  "pt-BR": "Pular para o conteudo principal",
  de: "Zum Hauptinhalt springen",
  en: "Skip to main content",
};

// CMS URL for preconnect
const cmsUrl = process.env.NEXT_PUBLIC_CMS_URL || "";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = getSiteUrl();

  // Get localized metadata
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const t = messages.metadata;
  const hreflangUrls = generateHreflangUrls("/", siteUrl);
  const localizedHomePath = toLocalizedPath("/", locale as Locale);

  return {
    metadataBase: new URL(siteUrl),
    applicationName: SITE_NAME,
    title: {
      default: t.title,
      template: t.titleTemplate,
    },
    description: t.description,
    keywords: t.keywords.split(", "),
    authors: [{ name: SITE_NAME, url: siteUrl }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      canonical: `${siteUrl}${localizedHomePath}`,
      languages: hreflangUrls,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: localeToOgLocale[locale] || "en_US",
      alternateLocale: locale === "en" ? "zh_CN" : "en_US",
      url: "/",
      siteName: SITE_NAME,
      title: t.ogTitle,
      description: t.ogDescription,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - Public API Directory`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.twitterTitle,
      description: t.twitterDescription,
      images: ["/opengraph-image"],
      creator: "@publicapi",
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    category: "technology",
  };
}

// Noto Sans JP font for Japanese text - temporarily disabled
// const notoSansJP = Noto_Sans_JP({
//   weight: ["400", "500", "700"],
//   subsets: ["latin"],
//   display: "swap",
//   variable: "--font-noto-sans-jp",
// });

// Viewport configuration - exported separately per Next.js 16 best practices
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0f14" },
    { media: "(prefers-color-scheme: light)", color: "#f7faf8" },
  ],
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate that the locale is supported
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();
  const siteUrl = getSiteUrl();
  const localizedHomePath = toLocalizedPath("/", locale as Locale);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    inLanguage: localeToLang[locale] || "en-US",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icon`,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}${localizedHomePath === "/" ? "" : localizedHomePath}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl,
    logo: `${siteUrl}/icon`,
    sameAs: ["https://github.com/public-apis/public-apis"],
    description: SITE_DESCRIPTION,
  };

  return (
    <html lang={locale} className="h-full scroll-smooth theme-dark">
      <head>
        {/* Favicon - Complete package with fallbacks */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon" />
        <link rel="manifest" href="/site.webmanifest" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE_NAME} RSS Feed`}
          href={`${siteUrl}/feed.xml`}
        />
        <link
          rel="alternate"
          type="application/atom+xml"
          title={`${SITE_NAME} Atom Feed`}
          href={`${siteUrl}/feed.atom`}
        />
        <link
          rel="sitemap"
          type="application/xml"
          href={`${siteUrl}/sitemap-index.xml`}
        />
        <link
          rel="sitemap"
          type="application/xml"
          href={`${siteUrl}/sitemap-images.xml`}
        />
        <meta name="theme-color" content="#3b82f6" />
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Preconnect and DNS prefetch for CMS backend */}
        {cmsUrl && <link rel="preconnect" href={cmsUrl} />}
        {cmsUrl && <link rel="dns-prefetch" href={cmsUrl} />}
        {/* DNS prefetch for API backend (fallback) */}
        <link rel="dns-prefetch" href="//api.public-api.org" />
        {/* hreflang tags for SEO */}
        {Object.entries(generateHreflangUrls("/", siteUrl)).map(
          ([lang, href]) => (
            <link key={lang} rel="alternate" hrefLang={lang} href={href} />
          ),
        )}
        {/* No-flash theme bootstrap */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const key = 'api-nav-theme';
                const stored = localStorage.getItem(key);
                const theme = stored === 'light' ? 'light' : 'dark';
                const root = document.documentElement;
                root.classList.toggle('theme-light', theme === 'light');
                root.classList.toggle('theme-dark', theme === 'dark');
              } catch (_) {}
            })();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {/* Skip to main content link - accessibility enhancement */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded focus:bg-[var(--bg-elevated)] focus:px-4 focus:py-2 focus:text-sm focus:text-[var(--accent-green)] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)]"
          >
            {skipToContentText[locale] || skipToContentText.en}
          </a>
          <div className="flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <SiteHeader />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

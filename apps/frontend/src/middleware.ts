import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match only user-facing pages that need i18n
  // Exclude API routes, Next.js internals, and static files
  matcher: [
    // Homepage
    "/",
    // Pages with locale prefix
    "/(en|zh)/:path*",
    // Pages without prefix (for default locale with localePrefix: 'as-needed')
    // Exclude Next.js internals, API routes, and static files
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};

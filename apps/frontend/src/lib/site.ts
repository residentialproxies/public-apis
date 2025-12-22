export const SITE_NAME = "Public API";
export const SITE_DOMAIN = "public-api.org";
export const SITE_DESCRIPTION =
  "Find the best public APIs faster: structured metadata, availability signals, and powerful filtering.";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? `https://${SITE_DOMAIN}`;
}

export function getSiteName(): string {
  return SITE_NAME;
}

export function getSiteDomain(): string {
  return SITE_DOMAIN;
}

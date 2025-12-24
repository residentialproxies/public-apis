/**
 * HTML Sanitization utility compatible with Cloudflare Workers
 *
 * Uses a simple allowlist-based approach instead of DOMPurify/jsdom
 * which doesn't work in Workers environment.
 */

// Allowed HTML tags for markdown-generated content
const ALLOWED_TAGS = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "br",
  "hr",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "a",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "del",
  "ins",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "img",
  "figure",
  "figcaption",
  "div",
  "span",
  "details",
  "summary",
]);

// Allowed attributes per tag
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading"]),
  code: new Set(["class"]),
  pre: new Set(["class"]),
  th: new Set(["scope", "colspan", "rowspan"]),
  td: new Set(["colspan", "rowspan"]),
  "*": new Set(["id", "class"]),
};

// Dangerous URL schemes
const DANGEROUS_SCHEMES = /^(javascript|vbscript|data):/i;

/**
 * Simple HTML sanitizer for Cloudflare Workers environment
 * Strips dangerous tags and attributes while preserving safe markdown-generated HTML
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  // Remove script tags and their content
  let result = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Remove style tags and their content
  result = result.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    "",
  );

  // Remove on* event handlers
  result = result.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  result = result.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: URLs from href/src attributes
  result = result.replace(
    /(href|src)\s*=\s*["']?\s*javascript:[^"'\s>]*/gi,
    '$1=""',
  );

  // Remove data: URLs (except for safe image types)
  result = result.replace(
    /(src)\s*=\s*["']?\s*data:(?!image\/(png|jpeg|gif|webp|svg\+xml))[^"'\s>]*/gi,
    '$1=""',
  );

  // Remove form elements that could be used for phishing
  result = result.replace(
    /<\/?(?:form|input|button|select|textarea|option|optgroup)\b[^>]*>/gi,
    "",
  );

  // Remove iframe, object, embed, and other potentially dangerous elements
  result = result.replace(
    /<\/?(?:iframe|object|embed|applet|base|meta|link)\b[^>]*>/gi,
    "",
  );

  return result;
}

/**
 * Strict sanitizer that only allows explicitly whitelisted tags
 * Use this for user-generated content (not currently used for AI-generated markdown)
 */
export function sanitizeHtmlStrict(html: string): string {
  if (!html || typeof html !== "string") return "";

  // First apply the basic sanitization
  let result = sanitizeHtml(html);

  // Then strip any remaining disallowed tags (keeping their content)
  result = result.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    const tagLower = tag.toLowerCase();
    if (ALLOWED_TAGS.has(tagLower)) {
      return match;
    }
    // Remove the tag but keep content
    return "";
  });

  return result;
}

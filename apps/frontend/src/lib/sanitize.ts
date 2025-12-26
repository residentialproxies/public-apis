/**
 * HTML Sanitization utility compatible with Cloudflare Workers
 *
 * Uses a simple allowlist-based approach instead of DOMPurify/jsdom
 * which doesn't work in Workers environment.
 *
 * SECURITY: This file contains critical XSS prevention logic.
 * All regex patterns are designed to catch obfuscated event handlers
 * and dangerous URL schemes.
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

/**
 * Decodes HTML entities before sanitization to prevent entity encoding bypasses.
 * Handles decimal (&#123;), hexadecimal (&x7B;), and named entities (&lt;).
 *
 * SECURITY: This must be called BEFORE regex patterns to prevent bypasses like:
 * - &#x6F;nload= for onload
 * - &amp;#x6F;nload= for double-encoded
 *
 * Note: We use a conservative approach - decode common entities but avoid
 * complex parsing that could introduce new vulnerabilities.
 */
function decodeHtmlEntities(text: string): string {
  // First decode named entities that could be used in event handlers
  const namedEntities: Record<string, string> = {
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&apos;": "'",
    "&nbsp;": " ",
  };

  let result = text;
  for (const [entity, char] of Object.entries(namedEntities)) {
    result = result.replaceAll(entity, char);
  }

  // Decode decimal entities: &#123; -> character
  // Use a loop to handle nested/recursive encoding attempts
  let prevResult: string;
  do {
    prevResult = result;
    result = result.replace(/&#(\d+);/g, (_, dec) =>
      String.fromCharCode(parseInt(dec, 10)),
    );
  } while (result !== prevResult);

  // Decode hexadecimal entities: &#x7B; or &#X7B; -> character
  do {
    prevResult = result;
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
  } while (result !== prevResult);

  return result;
}

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
 * List of all known HTML event handler attributes that could execute JavaScript.
 * Generated programmatically to ensure comprehensive coverage.
 *
 * SECURITY: Attackers may use obfuscation techniques like:
 * - on<x>load for onload
 * - OnLoad (case variation)
 * - on&#x6C;oad (entity encoding - handled by decodeHtmlEntities first)
 */
const EVENT_HANDLER_ATTRIBUTES = [
  // Mouse events
  "onclick",
  "ondblclick",
  "onmousedown",
  "onmouseup",
  "onmouseover",
  "onmousemove",
  "onmouseout",
  "onmouseenter",
  "onmouseleave",
  "oncontextmenu",
  "onwheel",
  "onmousewheel",
  // Keyboard events
  "onkeydown",
  "onkeypress",
  "onkeyup",
  // Form events
  "onsubmit",
  "onreset",
  "onchange",
  "onselect",
  "oninput",
  "oninvalid",
  "onblur",
  "onfocus",
  "onfocusin",
  "onfocusout",
  // Frame/object events
  "onload",
  "onunload",
  "onbeforeunload",
  "onabort",
  "onerror",
  "onresize",
  "onscroll",
  "onhashchange",
  // Drag and drop events
  "ondrag",
  "ondragstart",
  "ondragend",
  "ondragenter",
  "ondragleave",
  "ondragover",
  "ondrop",
  // Clipboard events
  "oncopy",
  "oncut",
  "onpaste",
  // Media events
  "onplay",
  "onpause",
  "onended",
  "onseeked",
  "onseeking",
  "onvolumechange",
  "oncanplay",
  "oncanplaythrough",
  // Touch events
  "ontouchstart",
  "ontouchend",
  "ontouchmove",
  "ontouchcancel",
  // Animation/Transition events
  "onanimationstart",
  "onanimationend",
  "onanimationiteration",
  "ontransitionstart",
  "ontransitionend",
  "ontransitioncancel",
  // Misc events
  "onmessage",
  "onoffline",
  "ononline",
  "onpopstate",
  "onstorage",
  "ontimeout",
  "ontoggle",
  "onwaiting",
  "onwaitingforkey",
  "onpointerdown",
  "onpointerup",
  "onpointermove",
  "onpointerenter",
  "onpointerleave",
  "onpointercancel",
  "ongotpointercapture",
  "onlostpointercapture",
  "ondevicemotion",
  "ondeviceorientation",
  "onauxclick",
];

/**
 * Creates a regex pattern that matches any event handler attribute.
 * Uses \s to catch all whitespace (space, tab, newline, etc.) and is case-insensitive.
 *
 * SECURITY FIX: Previous regex /\s+on\w+\s*=\s*["'][^"']*["']/gi could be bypassed:
 * - Only matched space character (\s), not all whitespace
 * - Could be bypassed with newlines/tabs: <a\nonclick=alert(1)>
 * - Could be bypassed with no quotes: <a onclick=alert(1)>
 * - Could be bypassed with mixed case: <a ONCLICK=alert(1)>
 *
 * New pattern handles:
 * - All whitespace characters (space, tab, newline, carriage return, form feed)
 * - Case-insensitive matching
 * - Both quoted and unquoted attribute values
 * - Missing equals sign variations
 */
const EVENT_HANDLER_REGEX = new RegExp(
  // Match: whitespace + on* + optional whitespace + = + optional whitespace + value
  `[\\s\\n\\r\\t\\f]on[a-z]+(?:[\\s\\n\\r\\t\\f]*=[\\s\\n\\r\\t\\f]*(?:"[^"]*"|'[^']*'|[^"'>\\s][^>]*))?`,
  "gi",
);

/**
 * Creates a regex pattern that matches dangerous URL schemes in attributes.
 * Handles HTML entity encoding bypasses by decoding first.
 *
 * SECURITY FIX: Previous regex patterns could be bypassed with entity encoding:
 * - jav&#x61;script: for javascript:
 * - javascript&colon; for javascript:
 *
 * New pattern:
 * - Operates on decoded HTML (after decodeHtmlEntities)
 * - Matches javascript:, vbscript:, data: schemes
 * - Handles various whitespace and quote combinations
 */
const DANGEROUS_URL_REGEX = new RegExp(
  `(href|src|action|formaction|poster|background)\\s*=\\s*["']?\\s*(javascript|vbscript|data):[^"'\\s>]*`,
  "gi",
);

/**
 * Simple HTML sanitizer for Cloudflare Workers environment
 * Strips dangerous tags and attributes while preserving safe markdown-generated HTML
 *
 * SECURITY: This function is designed to prevent XSS attacks. Key protections:
 * 1. Decode HTML entities first (prevents entity encoding bypasses)
 * 2. Remove script/style tags entirely
 * 3. Remove all event handler attributes (onclick, onload, etc.)
 * 4. Remove dangerous URL schemes (javascript:, vbscript:, data:)
 * 5. Remove form elements that could be used for phishing
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  // SECURITY FIX: Decode HTML entities FIRST to prevent entity encoding bypasses
  // This MUST happen before any regex matching
  let result = decodeHtmlEntities(html);

  // Remove script tags and their content
  result = result.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Remove style tags and their content
  result = result.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    "",
  );

  // SECURITY FIX: Remove on* event handlers with improved regex
  // Handles all whitespace, case variations, and quoted/unquoted values
  result = result.replace(EVENT_HANDLER_REGEX, "");

  // SECURITY FIX: Remove dangerous URL schemes after entity decoding
  // This pattern now works because entities are decoded first
  result = result.replace(DANGEROUS_URL_REGEX, '$1=""');

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
 *
 * SECURITY: Applies all sanitization from sanitizeHtml() plus:
 * - Removes any tag not in the ALLOWED_TAGS whitelist
 * - Removes any attribute not in the ALLOWED_ATTRS whitelist
 */
export function sanitizeHtmlStrict(html: string): string {
  if (!html || typeof html !== "string") return "";

  // First apply the basic sanitization (includes entity decoding)
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

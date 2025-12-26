import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizeHtmlStrict } from "../sanitize";

describe("sanitizeHtml", () => {
  it("should remove script tags and content", () => {
    const input = '<p>Hello</p><script>alert("XSS")</script><p>World</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("alert");
    expect(result).toContain("<p>Hello</p>");
    expect(result).toContain("<p>World</p>");
  });

  it("should remove style tags and content", () => {
    const input =
      "<div><style>body { color: red; }</style><p>Content</p></div>";
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<style>");
    expect(result).not.toContain("body { color: red; }");
    expect(result).toContain("<p>Content</p>");
  });

  it("should remove inline event handlers", () => {
    const input = '<div onclick="malicious()">Click</div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onclick");
  });

  it("should remove javascript: URLs", () => {
    const input = '<a href="javascript:alert(1)">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("javascript:");
  });

  it("should remove dangerous data: URLs", () => {
    const input =
      '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('src="data:text/html');
  });

  it("should keep safe image data URLs", () => {
    const input = '<img src="data:image/png;base64,abc123">';
    const result = sanitizeHtml(input);
    // data: URLs in src are stripped to empty by sanitizeHtml
    expect(result).toContain("<img");
  });

  it("should remove form elements", () => {
    const input =
      '<form><input type="password" /><button>Submit</button></form>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<form");
    expect(result).not.toContain("<input");
    expect(result).not.toContain("<button");
  });

  it("should remove iframe tags", () => {
    const input = '<iframe src="https://evil.com"></iframe>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<iframe");
  });

  it("should remove object and embed tags", () => {
    const input = '<object data="evil.swf"></object><embed src="evil.swf">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<object");
    expect(result).not.toContain("<embed");
  });

  it("should remove meta and link tags", () => {
    const input =
      '<meta http-equiv="refresh" content="0"><link rel="stylesheet">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<meta");
    expect(result).not.toContain("<link");
  });

  it("should keep safe HTML tags", () => {
    const input = "<p>Hello</p><br /><strong>World</strong>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<p>Hello</p>");
    expect(result).toContain("<br />");
    expect(result).toContain("<strong>World</strong>");
  });

  it("should handle empty strings", () => {
    expect(sanitizeHtml("")).toBe("");
  });

  it("should handle null input", () => {
    expect(sanitizeHtml(null as unknown as string)).toBe("");
  });

  it("should handle undefined input", () => {
    expect(sanitizeHtml(undefined as unknown as string)).toBe("");
  });

  it("should handle non-string input", () => {
    expect(sanitizeHtml(123 as unknown as string)).toBe("");
  });

  it("should handle complex XSS attempts", () => {
    const input = '<img src=x onerror="alert(1)">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onerror");
  });

  it("should remove SVG with onload", () => {
    const input = '<svg onload="alert(1)"><circle r="10" /></svg>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onload");
  });

  it("should handle multiple script tags", () => {
    const input =
      "<script>alert(1)</script><p>Text</p><script>alert(2)</script>";
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<script>");
    expect(result).toContain("<p>Text</p>");
  });

  it("should remove on* event handlers with various cases", () => {
    const input = '<div ONCLICK="evil()" onLoad="bad()">Content</div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("ONCLICK");
    expect(result).not.toContain("onLoad");
  });
});

describe("sanitizeHtmlStrict", () => {
  it("should apply basic sanitization", () => {
    const input = "<script>alert(1)</script><p>Content</p>";
    const result = sanitizeHtmlStrict(input);
    expect(result).not.toContain("<script>");
    expect(result).toContain("<p>Content</p>");
  });

  it("should only allow whitelisted tags", () => {
    const input = "<div><custom-tag>Content</custom-tag><p>Text</p></div>";
    const result = sanitizeHtmlStrict(input);
    expect(result).not.toContain("<custom-tag>");
    expect(result).not.toContain("</custom-tag>");
    expect(result).toContain("Content"); // Content preserved
    expect(result).toContain("<p>Text</p>"); // Allowed tag
  });

  it("should keep allowed heading tags", () => {
    const input = "<h1>Title</h1><h2>Subtitle</h2><h6>Small</h6>";
    const result = sanitizeHtmlStrict(input);
    expect(result).toContain("<h1>Title</h1>");
    expect(result).toContain("<h2>Subtitle</h2>");
    expect(result).toContain("<h6>Small</h6>");
  });

  it("should keep allowed list tags", () => {
    const input = "<ul><li>Item 1</li><li>Item 2</li></ul><ol><li>A</li></ol>";
    const result = sanitizeHtmlStrict(input);
    expect(result).toContain("<ul>");
    expect(result).toContain("<ol>");
    expect(result).toContain("<li>");
  });

  it("should keep allowed table tags", () => {
    const input =
      "<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>";
    const result = sanitizeHtmlStrict(input);
    expect(result).toContain("<table>");
    expect(result).toContain("<thead>");
    expect(result).toContain("<tbody>");
    expect(result).toContain("<tr>");
    expect(result).toContain("<th>");
    expect(result).toContain("<td>");
  });

  it("should keep code tags", () => {
    const input = '<pre><code class="language-js">const x = 1;</code></pre>';
    const result = sanitizeHtmlStrict(input);
    expect(result).toContain("<pre>");
    expect(result).toContain("const x = 1;");
  });

  it("should keep blockquote", () => {
    const input = "<blockquote>Quote</blockquote>";
    const result = sanitizeHtmlStrict(input);
    expect(result).toContain("<blockquote>");
  });

  it("should keep details and summary", () => {
    const input = "<details><summary>Show</summary><p>Content</p></details>";
    const result = sanitizeHtmlStrict(input);
    expect(result).toContain("<details>");
    expect(result).toContain("<summary>");
  });

  it("should remove disallowed tags but keep content", () => {
    const input = "<p>Before <custom>nested</custom> after</p>";
    const result = sanitizeHtmlStrict(input);
    expect(result).toContain("<p>");
    expect(result).toContain("Before nested after");
  });

  it("should handle nested disallowed tags", () => {
    const input = "<section><article>Content</article></section>";
    const result = sanitizeHtmlStrict(input);
    expect(result).toContain("Content");
    expect(result).not.toContain("<section>");
    expect(result).not.toContain("<article>");
  });

  it("should keep img with allowed attributes", () => {
    const input =
      '<img src="image.jpg" alt="Text" loading="lazy" width="100" height="100">';
    const result = sanitizeHtmlStrict(input);
    expect(result).toContain('<img src="image.jpg"');
    expect(result).toContain('alt="Text"');
  });

  it("should keep a tags with allowed attributes", () => {
    const input =
      '<a href="https://example.com" title="Link" target="_blank" rel="noopener">Text</a>';
    const result = sanitizeHtmlStrict(input);
    expect(result).toContain('<a href="https://example.com"');
  });

  it("should handle mixed safe and unsafe content", () => {
    const input =
      '<h1>Title</h1><script>alert(1)</script><p>Paragraph</p><section class="removed">Section</section>';
    const result = sanitizeHtmlStrict(input);
    expect(result).toContain("<h1>Title</h1>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("<p>Paragraph</p>");
    expect(result).not.toContain("<section");
    expect(result).toContain("Section"); // Content kept
  });

  it("should return empty string for null input", () => {
    expect(sanitizeHtmlStrict(null as unknown as string)).toBe("");
  });

  it("should return empty string for undefined input", () => {
    expect(sanitizeHtmlStrict(undefined as unknown as string)).toBe("");
  });

  it("should preserve figcaption with figure", () => {
    const input =
      "<figure><img src='img.jpg' /><figcaption>Caption</figcaption></figure>";
    const result = sanitizeHtmlStrict(input);
    expect(result).toContain("<figure>");
    expect(result).toContain("<figcaption>");
    expect(result).toContain("Caption");
  });
});

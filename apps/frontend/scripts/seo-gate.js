#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const failures = [];
const warnings = [];

function readFile(relPath) {
  const abs = path.join(projectRoot, relPath);
  if (!fs.existsSync(abs)) {
    failures.push(`Missing required file: ${relPath}`);
    return "";
  }

  return fs.readFileSync(abs, "utf8");
}

function assertFile(relPath) {
  const abs = path.join(projectRoot, relPath);
  if (!fs.existsSync(abs)) {
    failures.push(`Missing required file: ${relPath}`);
  }
}

function assertContains(relPath, patterns) {
  const content = readFile(relPath);
  if (!content) return;

  for (const pattern of patterns) {
    if (!content.includes(pattern)) {
      failures.push(`Missing \`${pattern}\` in ${relPath}`);
    }
  }
}

function assertAnyContains(relPath, patterns, label) {
  const content = readFile(relPath);
  if (!content) return;

  const found = patterns.some((pattern) => content.includes(pattern));
  if (!found) {
    failures.push(`Missing ${label} in ${relPath}`);
  }
}

function validateSnapshot() {
  const relPath = "public/all-apis.json";
  const absPath = path.join(projectRoot, relPath);

  if (!fs.existsSync(absPath)) {
    failures.push(`Missing snapshot data file: ${relPath}`);
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(absPath, "utf8"));

    if (!Array.isArray(data.apis)) {
      failures.push("public/all-apis.json does not contain an `apis` array");
      return;
    }

    if (data.apis.length === 0) {
      warnings.push("public/all-apis.json has an empty `apis` array");
      return;
    }

    const screenshotCount = data.apis.filter(
      (api) => typeof api?.screenshot?.path === "string" && api.screenshot.path,
    ).length;

    if (screenshotCount === 0) {
      failures.push(
        "public/all-apis.json has no screenshot entries for image sitemap",
      );
      return;
    }

    console.log(
      `✓ Snapshot validated: ${data.apis.length} APIs, ${screenshotCount} screenshot records`,
    );
  } catch (error) {
    failures.push(`Failed to parse public/all-apis.json: ${String(error)}`);
  }
}

function runChecks() {
  const requiredFiles = [
    "src/app/sitemap.ts",
    "src/app/sitemap-index.xml/route.ts",
    "src/app/sitemap-images.xml/route.ts",
    "src/app/robots.ts",
    "src/app/feed.xml/route.ts",
    "src/app/feed.atom/route.ts",
    "src/app/[locale]/privacy/page.tsx",
    "src/app/[locale]/terms/page.tsx",
    "src/app/[locale]/trust/page.tsx",
    "src/components/SiteFooter.tsx",
    "src/lib/locales.ts",
  ];

  requiredFiles.forEach(assertFile);

  assertContains("src/app/robots.ts", [
    "sitemap-index.xml",
    "sitemap-images.xml",
    "sitemap.xml",
  ]);

  assertContains("src/app/sitemap.ts", ["/privacy", "/terms", "/trust"]);

  assertContains("src/components/SiteFooter.tsx", [
    'href: "/privacy"',
    'href: "/terms"',
    'href: "/trust"',
    'href: "/sitemap-index.xml"',
    'href: "/sitemap-images.xml"',
  ]);

  assertContains("src/app/[locale]/privacy/page.tsx", [
    "generateHreflangUrls",
    "toLocalizedUrl",
    "Privacy Policy",
  ]);

  assertContains("src/app/[locale]/terms/page.tsx", [
    "generateHreflangUrls",
    "toLocalizedUrl",
    "Terms of Service",
  ]);

  assertContains("src/app/[locale]/trust/page.tsx", [
    "generateHreflangUrls",
    "toLocalizedUrl",
    "Trust",
  ]);

  assertAnyContains(
    "src/app/sitemap-images.xml/route.ts",
    [
      'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
      "<image:image>",
    ],
    "image sitemap namespace",
  );

  validateSnapshot();
}

console.log("\n=== SEO Quality Gate ===\n");
runChecks();

if (warnings.length > 0) {
  console.log("Warnings:");
  warnings.forEach((warning) => console.log(`  - ${warning}`));
  console.log("");
}

if (failures.length > 0) {
  console.error("SEO gate failed:\n");
  failures.forEach((failure) => console.error(`  - ${failure}`));
  console.error(`\nTotal failures: ${failures.length}`);
  process.exit(1);
}

console.log("SEO gate passed ✓\n");

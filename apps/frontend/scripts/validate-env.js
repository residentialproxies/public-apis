#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Environment Variable Validation Script
 * Run this to validate your environment configuration before starting the dev server
 */

const fs = require("fs");
const path = require("path");

const requiredVars = ["NEXT_PUBLIC_CMS_URL", "NEXT_PUBLIC_SITE_URL"];

const optionalVars = ["NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, "utf-8");
  const vars = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();

    if (key && value) {
      vars[key] = value;
    }
  }

  return vars;
}

function validateUrl(varName, value) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { valid: false, error: `Must use http:// or https:// protocol` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: `Invalid URL format` };
  }
}

function validateEnv() {
  const nodeEnv = process.env.NODE_ENV || "development";
  console.log(
    `\x1b[36m%s\x1b[0m`,
    `\n=== Environment Validation (${nodeEnv}) ===\n`,
  );

  const envFiles = [".env.local", `.env.${nodeEnv}`, ".env"];

  const allVars = {};
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    const vars = loadEnvFile(filePath);
    Object.assign(allVars, vars);
    if (Object.keys(vars).length > 0) {
      console.log(
        `  \x1b[90mLoaded from ${file}:\x1b[0m ${Object.keys(vars).join(", ")}`,
      );
    }
  }

  // Also include process.env
  for (const key of requiredVars) {
    if (process.env[key]) {
      allVars[key] = process.env[key];
    }
  }

  console.log("");

  // Check required vars
  const missing = [];
  for (const varName of requiredVars) {
    if (!allVars[varName]) {
      missing.push(varName);
    }
  }

  // In production, require all vars
  if (nodeEnv === "production" && missing.length > 0) {
    console.error(
      `  \x1b[31m✗ Missing required environment variables:\x1b[0m ${missing.join(", ")}`,
    );
    console.error(
      `  \x1b[31mPlease set them in your deployment environment.\x1b[0m\n`,
    );
    process.exit(1);
  }

  // Validate URL formats
  const invalid = [];
  for (const varName of ["NEXT_PUBLIC_CMS_URL", "NEXT_PUBLIC_SITE_URL"]) {
    const value = allVars[varName];
    if (value) {
      const validation = validateUrl(varName, value);
      if (!validation.valid) {
        invalid.push({ var: varName, error: validation.error });
      }
    }
  }

  if (invalid.length > 0) {
    console.error(`  \x1b[31m✗ Invalid environment variables:\x1b[0m`);
    for (const { var: v, error } of invalid) {
      console.error(`    \x1b[31m${v}: ${error}\x1b[0m`);
    }
    console.error("");
    process.exit(1);
  }

  // Show warnings for missing vars in development
  if (nodeEnv === "development" && missing.length > 0) {
    console.log(
      `  \x1b[33m⚠ Using defaults for missing variables:\x1b[0m ${missing.join(", ")}`,
    );
    console.log(`  \x1b[90m(These will use localhost defaults)\x1b[0m\n`);
  }

  // Show active configuration
  console.log(`  \x1b[32m✓ Environment validation passed!\x1b[0m\n`);
  console.log(`  \x1b[90mActive configuration:\x1b[0m`);
  for (const varName of [...requiredVars, ...optionalVars]) {
    const value = allVars[varName] || "\x1b[90m(not set)\x1b[0m";
    const isSet = !!allVars[varName];
    const color = isSet ? "\x1b[32m" : "\x1b[90m";
    console.log(`    ${color}${varName}=\x1b[0m${value}`);
  }
  console.log("");

  // Show helpful hints
  if (nodeEnv === "development") {
    const cmsUrl = allVars.NEXT_PUBLIC_CMS_URL || "http://localhost:3001";
    console.log(`  \x1b[90mMake sure backend is running at:\x1b[0m ${cmsUrl}`);
    console.log(
      `  \x1b[90mStart with: \x1b[0mpnpm --filter @api-navigator/backend dev`,
    );
    console.log("");
  }

  return true;
}

// Run validation
validateEnv();

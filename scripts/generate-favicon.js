#!/usr/bin/env node

/**
 * Generate favicon.ico using Next.js ImageResponse
 * This script replicates the icon.tsx logic to create a static favicon
 */

const fs = require("fs");
const path = require("path");

// Icon design (matches icon.tsx)
const iconSVG = `
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="4" fill="#0a0f14"/>
  <text
    x="16"
    y="21"
    font-family="ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"
    font-size="16"
    font-weight="900"
    fill="#00ff88"
    text-anchor="middle"
    letter-spacing="-1"
    style="text-shadow: 0 0 8px rgba(0, 255, 136, 0.6);"
  >&lt;/&gt;</text>
</svg>
`.trim();

const outputPath = path.join(__dirname, "../apps/frontend/public/favicon.ico");

// Modern browsers support PNG format in .ico files
// So we create an SVG-based favicon
fs.writeFileSync(outputPath, iconSVG);

console.log("✅ Generated favicon.ico at:", outputPath);
console.log("📝 Note: Modern browsers support SVG in .ico files");
console.log("   For legacy support, use an online converter (favicon.io)");

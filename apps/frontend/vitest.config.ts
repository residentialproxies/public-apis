import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // 使用 happy-dom 作为浏览器环境模拟（比 jsdom 更快）
    environment: "happy-dom",

    // 全局测试设置
    globals: true,

    // 测试文件匹配模式
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
    ],

    // 排除模式
    exclude: [
      "node_modules",
      ".next",
      "dist",
      "build",
      ".open-next",
      "tests/e2e/**/*",
    ],

    // 设置文件
    setupFiles: ["./vitest.setup.ts"],

    // 覆盖率配置
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        ".next/",
        "vitest.config.ts",
        "vitest.setup.ts",
        "playwright.config.ts",
        "**/*.d.ts",
        "**/*.config.{ts,js}",
        "**/test/**",
        "**/tests/**",
      ],
      // 覆盖率阈值
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },

    // 测试超时
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

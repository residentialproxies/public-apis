import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

/**
 * Playwright E2E 测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 测试目录
  testDir: "./tests/e2e",

  // 测试匹配模式
  testMatch: "**/*.e2e.{ts,tsx}",

  // CI 环境禁止 test.only
  forbidOnly: !!process.env.CI,

  // CI 环境重试策略
  retries: process.env.CI ? 2 : 0,

  // 并行worker数量
  workers: process.env.CI ? 1 : undefined,

  // 报告器配置
  reporter: process.env.CI
    ? [
        ["github"],
        ["html", { open: "never" }],
        ["json", { outputFile: "test-results.json" }],
      ]
    : [["list"], ["html", { open: "on-failure" }]],

  // 全局配置
  use: {
    // 基础 URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3010",

    // 浏览器上下文选项
    viewport: { width: 1280, height: 720 },

    // 失败时重试时收集trace
    trace: "on-first-retry",

    // 截图策略
    screenshot: "only-on-failure",

    // 视频录制
    video: "retain-on-failure",

    // 导航超时
    navigationTimeout: 30000,

    // 操作超时
    actionTimeout: 15000,
  },

  // 测试项目（不同浏览器）
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // 移动端测试
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  // 开发服务器配置
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3010",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
  },

  // 输出目录
  outputDir: "test-results",

  // 超时配置
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
});

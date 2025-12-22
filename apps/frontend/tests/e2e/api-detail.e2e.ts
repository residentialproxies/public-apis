import { test, expect } from "@playwright/test";

test.describe("API Detail Page", () => {
  // 使用一个已知的API ID进行测试（需要根据实际数据调整）
  const testApiPath = "/api/1/test-api"; // 这个需要根据实际数据调整

  test("should display API details", async ({ page }) => {
    // 从首页导航到API详情
    await page.goto("/");

    // 点击第一个API卡片
    const firstApiCard = page.locator('[data-testid="api-card"]').first();
    await firstApiCard.click();

    // 等待导航完成
    await page.waitForURL(/\/api\/\d+\//);

    // 验证API名称显示
    const apiName = page.getByRole("heading", { level: 1 });
    await expect(apiName).toBeVisible();
  });

  test("should display health status", async ({ page }) => {
    await page.goto("/");
    const firstApiCard = page.locator('[data-testid="api-card"]').first();
    await firstApiCard.click();

    await page.waitForURL(/\/api\/\d+\//);

    // 检查健康状态标志
    const healthBadge = page.locator('[data-testid="health-status"]');
    await expect(healthBadge).toBeVisible();
  });

  test("should display API metadata", async ({ page }) => {
    await page.goto("/");
    const firstApiCard = page.locator('[data-testid="api-card"]').first();
    await firstApiCard.click();

    await page.waitForURL(/\/api\/\d+\//);

    // 检查关键信号表格
    const metadataSection = page.getByText(/key signals/i);
    await expect(metadataSection).toBeVisible();
  });

  test("should have breadcrumb navigation", async ({ page }) => {
    await page.goto("/");
    const firstApiCard = page.locator('[data-testid="api-card"]').first();
    await firstApiCard.click();

    await page.waitForURL(/\/api\/\d+\//);

    // 检查面包屑导航
    const breadcrumb = page.locator('nav[aria-label*="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // 验证面包屑链接可点击
    const homeLink = breadcrumb.getByRole("link", { name: /api navigator/i });
    await expect(homeLink).toBeVisible();
  });

  test("should have structured data", async ({ page }) => {
    await page.goto("/");
    const firstApiCard = page.locator('[data-testid="api-card"]').first();
    await firstApiCard.click();

    await page.waitForURL(/\/api\/\d+\//);

    // 检查 WebAPI Schema
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();

    expect(count).toBeGreaterThan(0);

    // 验证包含 WebAPI 类型
    const firstSchema = await jsonLd.first().textContent();
    expect(firstSchema).toContain('"@type"');
  });

  test("should redirect on incorrect slug", async ({ page }) => {
    // 访问带有错误slug的URL
    await page.goto("/api/1/wrong-slug");

    // 应该重定向到正确的slug（或404）
    await page.waitForLoadState("networkidle");

    // 验证最终URL不是原始的错误slug
    const url = page.url();
    expect(url).not.toContain("/wrong-slug");
  });
});

test.describe("API Detail - Playground", () => {
  test("should display API playground if available", async ({ page }) => {
    await page.goto("/");
    const firstApiCard = page.locator('[data-testid="api-card"]').first();
    await firstApiCard.click();

    await page.waitForURL(/\/api\/\d+\//);

    // 检查Playground组件（可能是懒加载的）
    const playgroundHeading = page.getByRole("heading", {
      name: /playground|try it/i,
    });

    // Playground可能不是所有API都有，所以用 count() 检查
    const count = await playgroundHeading.count();
    if (count > 0) {
      await expect(playgroundHeading).toBeVisible();
    }
  });
});

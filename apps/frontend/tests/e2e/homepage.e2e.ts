import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/API Navigator/);
  });

  test("should display main heading", async ({ page }) => {
    const heading = page.getByRole("heading", {
      name: /public api navigator/i,
    });
    await expect(heading).toBeVisible();
  });

  test("should have search input", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search apis/i);
    await expect(searchInput).toBeVisible();
  });

  test("should display API cards", async ({ page }) => {
    // 等待API列表加载
    await page.waitForSelector('[data-testid="api-card"]', { timeout: 5000 });

    const apiCards = page.locator('[data-testid="api-card"]');
    const count = await apiCards.count();

    expect(count).toBeGreaterThan(0);
  });

  test("should filter by category", async ({ page }) => {
    // 点击分类筛选器
    const categoryFilter = page
      .getByRole("button", { name: /animals/i })
      .first();
    await categoryFilter.click();

    // 等待URL更新
    await page.waitForURL(/category=/);

    // 验证URL包含category参数
    expect(page.url()).toContain("category=");
  });

  test("should search for APIs", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search apis/i);
    await searchInput.fill("weather");
    await searchInput.press("Enter");

    // 等待URL更新
    await page.waitForURL(/q=weather/);

    // 验证搜索参数
    expect(page.url()).toContain("q=weather");
  });

  test("should be accessible", async ({ page }) => {
    // 检查 Skip to Main Content 链接
    const skipLink = page.getByRole("link", { name: /skip to main content/i });
    await expect(skipLink).toBeAttached();

    // 键盘导航测试
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
  });

  test("should be responsive", async ({ page }) => {
    // 测试移动端视图
    await page.setViewportSize({ width: 375, height: 667 });

    const heading = page.getByRole("heading", {
      name: /public api navigator/i,
    });
    await expect(heading).toBeVisible();

    // 测试平板视图
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(heading).toBeVisible();

    // 测试桌面视图
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(heading).toBeVisible();
  });
});

test.describe("SEO & Meta Tags", () => {
  test("should have correct meta tags", async ({ page }) => {
    await page.goto("/");

    // 检查 meta description
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute(
      "content",
      /Find the best public APIs/,
    );

    // 检查 Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /API Navigator/);
  });

  test("should have JSON-LD structured data", async ({ page }) => {
    await page.goto("/");

    // 检查 WebSite Schema
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const content = await jsonLd.textContent();

    expect(content).toContain('"@type":"WebSite"');
    expect(content).toContain('"@type":"SearchAction"');
  });
});

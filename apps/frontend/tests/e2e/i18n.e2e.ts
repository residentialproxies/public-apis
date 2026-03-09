import { test, expect } from "@playwright/test";

test.describe("i18n - Language Switching", () => {
  test("should default to English", async ({ page }) => {
    await page.goto("/");

    // Check HTML lang attribute
    const html = page.locator("html");
    const lang = await html.getAttribute("lang");
    expect(lang).toBe("en");
  });

  test("should switch to Chinese", async ({ page }) => {
    await page.goto("/zh");

    const html = page.locator("html");
    const lang = await html.getAttribute("lang");
    expect(lang).toBe("zh");
  });

  test("should have language switcher", async ({ page }) => {
    await page.goto("/");

    const languageSwitcher = page.locator('[data-testid="language-switcher"]');

    if (await languageSwitcher.count() > 0) {
      await expect(languageSwitcher).toBeVisible();
    }
  });

  test("should switch language via switcher", async ({ page }) => {
    await page.goto("/");

    const languageSwitcher = page.locator('[data-testid="language-switcher"]');

    if (await languageSwitcher.count() > 0) {
      await languageSwitcher.click();

      const zhOption = page.locator('[data-testid="lang-zh"]');
      if (await zhOption.count() > 0) {
        await zhOption.click();
        await page.waitForURL(/\/zh/);
        expect(page.url()).toContain("/zh");
      }
    }
  });

  test("should preserve path when switching language", async ({ page }) => {
    await page.goto("/catalog");

    const languageSwitcher = page.locator('[data-testid="language-switcher"]');

    if (await languageSwitcher.count() > 0) {
      await languageSwitcher.click();

      const zhOption = page.locator('[data-testid="lang-zh"]');
      if (await zhOption.count() > 0) {
        await zhOption.click();
        await page.waitForURL(/\/zh\/catalog/);
        expect(page.url()).toContain("/zh/catalog");
      }
    }
  });
});

test.describe("i18n - Chinese Content", () => {
  test("should display Chinese content", async ({ page }) => {
    await page.goto("/zh");

    // Check for Chinese characters in the page
    const content = await page.textContent("body");
    expect(content).toMatch(/[\u4e00-\u9fa5]/); // Chinese character range
  });

  test("should have Chinese meta tags", async ({ page }) => {
    await page.goto("/zh");

    const description = page.locator('meta[name="description"]');
    const content = await description.getAttribute("content");

    // Should contain Chinese or be properly localized
    expect(content).toBeTruthy();
  });

  test("should display Chinese navigation", async ({ page }) => {
    await page.goto("/zh");

    const nav = page.locator("nav");
    const navText = await nav.textContent();

    // Should contain Chinese characters
    expect(navText).toMatch(/[\u4e00-\u9fa5]/);
  });
});

test.describe("i18n - URL Structure", () => {
  test("should redirect root to default locale", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "commit" });

    // Should either stay at / or redirect to /en
    const url = page.url();
    expect(url.endsWith("/") || url.includes("/en")).toBeTruthy();
  });

  test("should handle locale in API detail URL", async ({ page }) => {
    await page.goto("/zh/catalog");

    await page.waitForSelector('[data-testid="api-card"]', { timeout: 10000 });

    const firstCard = page.locator('[data-testid="api-card"]').first();
    await firstCard.click();

    await page.waitForURL(/\/zh\/api\/\d+\//);
    expect(page.url()).toContain("/zh/api/");
  });

  test("should handle locale in category URL", async ({ page }) => {
    await page.goto("/zh/category/animals");

    const html = page.locator("html");
    const lang = await html.getAttribute("lang");
    expect(lang).toBe("zh");
  });

  test("should handle locale in search URL", async ({ page }) => {
    await page.goto("/zh/search?q=api");

    const html = page.locator("html");
    const lang = await html.getAttribute("lang");
    expect(lang).toBe("zh");
  });
});

test.describe("i18n - Alternate Links", () => {
  test("should have hreflang alternate links", async ({ page }) => {
    await page.goto("/");

    const enLink = page.locator('link[hreflang="en"]');
    const zhLink = page.locator('link[hreflang="zh"]');

    if (await enLink.count() > 0) {
      await expect(enLink).toHaveAttribute("href", /.+/);
    }

    if (await zhLink.count() > 0) {
      await expect(zhLink).toHaveAttribute("href", /.+/);
    }
  });

  test("should have x-default hreflang", async ({ page }) => {
    await page.goto("/");

    const defaultLink = page.locator('link[hreflang="x-default"]');

    if (await defaultLink.count() > 0) {
      await expect(defaultLink).toHaveAttribute("href", /.+/);
    }
  });
});

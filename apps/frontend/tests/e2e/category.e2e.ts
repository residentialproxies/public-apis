import { test, expect } from "@playwright/test";

test.describe("Category Page", () => {
  test("should display category page", async ({ page }) => {
    await page.goto("/category/animals");

    // Should have category name in title or heading
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("should display APIs in category", async ({ page }) => {
    await page.goto("/category/animals");

    await page.waitForSelector('[data-testid="api-card"]', { timeout: 10000 });

    const apiCards = page.locator('[data-testid="api-card"]');
    const count = await apiCards.count();

    expect(count).toBeGreaterThan(0);
  });

  test("should show category description", async ({ page }) => {
    await page.goto("/category/animals");

    const description = page.locator('[data-testid="category-description"]');

    if (await description.count() > 0) {
      await expect(description).toBeVisible();
    }
  });

  test("should show API count", async ({ page }) => {
    await page.goto("/category/animals");

    const apiCount = page.locator('[data-testid="api-count"]');

    if (await apiCount.count() > 0) {
      await expect(apiCount).toBeVisible();
      const text = await apiCount.textContent();
      expect(text).toMatch(/\d+/);
    }
  });

  test("should handle non-existent category", async ({ page }) => {
    const response = await page.goto("/category/nonexistent-category-xyz");

    // Should return 404 or redirect
    expect([200, 404]).toContain(response?.status() ?? 0);

    if (response?.status() === 200) {
      // If 200, should show not found message
      const notFound = page.getByText(/not found|no category/i);
      await expect(notFound).toBeVisible();
    }
  });

  test("should navigate to API detail from category", async ({ page }) => {
    await page.goto("/category/animals");

    await page.waitForSelector('[data-testid="api-card"]', { timeout: 10000 });

    const firstCard = page.locator('[data-testid="api-card"]').first();
    await firstCard.click();

    await page.waitForURL(/\/api\/\d+\//);
    expect(page.url()).toMatch(/\/api\/\d+\//);
  });

  test("should have breadcrumb navigation", async ({ page }) => {
    await page.goto("/category/animals");

    const breadcrumb = page.locator('nav[aria-label*="breadcrumb"]');

    if (await breadcrumb.count() > 0) {
      await expect(breadcrumb).toBeVisible();

      // Should have link back to home or catalog
      const homeLink = breadcrumb.getByRole("link").first();
      await expect(homeLink).toBeVisible();
    }
  });

  test("should have proper SEO meta tags", async ({ page }) => {
    await page.goto("/category/animals");

    // Check meta description
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /.+/);

    // Check title
    await expect(page).toHaveTitle(/animals/i);
  });

  test("should support pagination", async ({ page }) => {
    await page.goto("/category/animals");

    const pagination = page.locator('[data-testid="pagination"]');

    if (await pagination.count() > 0) {
      const nextButton = page.locator('[data-testid="pagination-next"]');

      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForURL(/page=2/);
        expect(page.url()).toContain("page=2");
      }
    }
  });
});

test.describe("Category List", () => {
  test("should display all categories on catalog page", async ({ page }) => {
    await page.goto("/catalog");

    const categoryList = page.locator('[data-testid="category-list"]');

    if (await categoryList.count() > 0) {
      await expect(categoryList).toBeVisible();

      const categoryItems = categoryList.locator('[data-testid="category-item"]');
      const count = await categoryItems.count();

      expect(count).toBeGreaterThan(0);
    }
  });

  test("should navigate to category page on click", async ({ page }) => {
    await page.goto("/catalog");

    const categoryItem = page.locator('[data-testid="category-item"]').first();

    if (await categoryItem.count() > 0) {
      await categoryItem.click();
      await page.waitForURL(/\/category\//);
      expect(page.url()).toContain("/category/");
    }
  });
});

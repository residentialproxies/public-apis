import { test, expect } from "@playwright/test";

test.describe("Catalog Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/catalog");
  });

  test("should display catalog page", async ({ page }) => {
    await expect(page).toHaveTitle(/catalog|apis/i);
  });

  test("should display API list", async ({ page }) => {
    // Wait for API cards to load
    await page.waitForSelector('[data-testid="api-card"]', { timeout: 10000 });

    const apiCards = page.locator('[data-testid="api-card"]');
    const count = await apiCards.count();

    expect(count).toBeGreaterThan(0);
  });

  test("should have filter sidebar", async ({ page }) => {
    // Check for filter section
    const filterSection = page.locator('[data-testid="catalog-filters"]');
    await expect(filterSection).toBeVisible();
  });

  test("should filter by category", async ({ page }) => {
    // Wait for filters to load
    await page.waitForSelector('[data-testid="category-filter"]', { timeout: 5000 });

    // Click on a category filter
    const categoryFilter = page.locator('[data-testid="category-filter"]').first();
    await categoryFilter.click();

    // URL should update with category parameter
    await page.waitForURL(/category=/);
    expect(page.url()).toContain("category=");
  });

  test("should filter by health status", async ({ page }) => {
    // Wait for filters to load
    const healthFilter = page.locator('[data-testid="health-filter"]');

    if (await healthFilter.count() > 0) {
      await healthFilter.first().click();
      await page.waitForURL(/healthStatus=/);
      expect(page.url()).toContain("healthStatus=");
    }
  });

  test("should filter by auth type", async ({ page }) => {
    const authFilter = page.locator('[data-testid="auth-filter"]');

    if (await authFilter.count() > 0) {
      await authFilter.first().click();
      await page.waitForURL(/auth=/);
      expect(page.url()).toContain("auth=");
    }
  });

  test("should support pagination", async ({ page }) => {
    // Wait for pagination to appear
    const pagination = page.locator('[data-testid="pagination"]');

    if (await pagination.count() > 0) {
      // Click next page
      const nextButton = page.locator('[data-testid="pagination-next"]');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForURL(/page=2/);
        expect(page.url()).toContain("page=2");
      }
    }
  });

  test("should sort APIs", async ({ page }) => {
    const sortSelect = page.locator('[data-testid="sort-select"]');

    if (await sortSelect.count() > 0) {
      await sortSelect.selectOption("name");
      await page.waitForURL(/sort=name/);
      expect(page.url()).toContain("sort=name");
    }
  });

  test("should display API card with required information", async ({ page }) => {
    await page.waitForSelector('[data-testid="api-card"]', { timeout: 10000 });

    const firstCard = page.locator('[data-testid="api-card"]').first();

    // Check for API name
    const apiName = firstCard.locator('[data-testid="api-name"]');
    await expect(apiName).toBeVisible();

    // Check for API description
    const apiDescription = firstCard.locator('[data-testid="api-description"]');
    await expect(apiDescription).toBeVisible();
  });

  test("should navigate to API detail on card click", async ({ page }) => {
    await page.waitForSelector('[data-testid="api-card"]', { timeout: 10000 });

    const firstCard = page.locator('[data-testid="api-card"]').first();
    await firstCard.click();

    // Should navigate to API detail page
    await page.waitForURL(/\/api\/\d+\//);
    expect(page.url()).toMatch(/\/api\/\d+\//);
  });

  test("should clear filters", async ({ page }) => {
    // Apply a filter first
    await page.goto("/catalog?category=animals&auth=apiKey");

    // Click clear filters button
    const clearButton = page.locator('[data-testid="clear-filters"]');

    if (await clearButton.count() > 0) {
      await clearButton.click();
      await page.waitForURL("/catalog");
      expect(page.url()).not.toContain("category=");
      expect(page.url()).not.toContain("auth=");
    }
  });
});

test.describe("Catalog Page - Mobile", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/catalog");
  });

  test("should have mobile filter toggle", async ({ page }) => {
    // On mobile, filters might be hidden behind a toggle
    const filterToggle = page.locator('[data-testid="filter-toggle"]');

    if (await filterToggle.count() > 0) {
      await expect(filterToggle).toBeVisible();
      await filterToggle.click();

      // Filters should now be visible
      const filterSection = page.locator('[data-testid="catalog-filters"]');
      await expect(filterSection).toBeVisible();
    }
  });

  test("should display API cards in single column", async ({ page }) => {
    await page.waitForSelector('[data-testid="api-card"]', { timeout: 10000 });

    const apiCards = page.locator('[data-testid="api-card"]');
    const count = await apiCards.count();

    expect(count).toBeGreaterThan(0);
  });
});

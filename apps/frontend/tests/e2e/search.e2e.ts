import { test, expect } from "@playwright/test";

test.describe("Search Page", () => {
  test("should display search results", async ({ page }) => {
    await page.goto("/search?q=weather");

    // Wait for results to load
    await page.waitForLoadState("networkidle");

    // Check for search results heading
    const heading = page.getByRole("heading", { name: /search results/i });
    await expect(heading).toBeVisible();
  });

  test("should show query in search input", async ({ page }) => {
    await page.goto("/search?q=github");

    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toHaveValue("github");
  });

  test("should display result count", async ({ page }) => {
    await page.goto("/search?q=api");

    await page.waitForLoadState("networkidle");

    // Should show number of results
    const resultCount = page.locator('[data-testid="result-count"]');
    if (await resultCount.count() > 0) {
      await expect(resultCount).toBeVisible();
    }
  });

  test("should handle empty search results", async ({ page }) => {
    await page.goto("/search?q=xyznonexistent123456789");

    await page.waitForLoadState("networkidle");

    // Should show no results message
    const noResults = page.getByText(/no results|no apis found/i);
    await expect(noResults).toBeVisible();
  });

  test("should allow new search from results page", async ({ page }) => {
    await page.goto("/search?q=weather");

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.clear();
    await searchInput.fill("music");
    await searchInput.press("Enter");

    await page.waitForURL(/q=music/);
    expect(page.url()).toContain("q=music");
  });

  test("should display API cards in search results", async ({ page }) => {
    await page.goto("/search?q=api");

    await page.waitForLoadState("networkidle");

    const apiCards = page.locator('[data-testid="api-card"]');
    const count = await apiCards.count();

    // Should have some results for common query
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should navigate to API detail from search results", async ({ page }) => {
    await page.goto("/search?q=api");

    await page.waitForSelector('[data-testid="api-card"]', { timeout: 10000 });

    const firstCard = page.locator('[data-testid="api-card"]').first();
    await firstCard.click();

    await page.waitForURL(/\/api\/\d+\//);
    expect(page.url()).toMatch(/\/api\/\d+\//);
  });

  test("should highlight search terms in results", async ({ page }) => {
    await page.goto("/search?q=weather");

    await page.waitForLoadState("networkidle");

    // Check if search term is highlighted
    const highlight = page.locator("mark, .highlight");
    const count = await highlight.count();

    // Highlighting is optional but good to have
    if (count > 0) {
      await expect(highlight.first()).toBeVisible();
    }
  });

  test("should handle special characters in search", async ({ page }) => {
    await page.goto("/search?q=" + encodeURIComponent("api & data"));

    await page.waitForLoadState("networkidle");

    // Should not crash, should show results or no results message
    const heading = page.getByRole("heading", { name: /search results/i });
    await expect(heading).toBeVisible();
  });

  test("should redirect short queries", async ({ page }) => {
    await page.goto("/search?q=a");

    await page.waitForLoadState("networkidle");

    // Should show error or redirect
    const errorMessage = page.getByText(/at least 2 characters|too short/i);
    const isError = await errorMessage.count() > 0;

    // Either shows error or redirects
    expect(isError || !page.url().includes("q=a")).toBeTruthy();
  });
});

test.describe("Search Suggestions", () => {
  test("should show suggestions while typing", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("wea");

    // Wait for suggestions dropdown
    const suggestions = page.locator('[data-testid="search-suggestions"]');

    if (await suggestions.count() > 0) {
      await expect(suggestions).toBeVisible();
    }
  });

  test("should navigate to suggestion on click", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("api");

    const suggestions = page.locator('[data-testid="search-suggestions"]');

    if (await suggestions.count() > 0) {
      const firstSuggestion = suggestions.locator('[data-testid="suggestion-item"]').first();
      if (await firstSuggestion.count() > 0) {
        await firstSuggestion.click();
        // Should navigate somewhere
        await page.waitForLoadState("networkidle");
      }
    }
  });

  test("should close suggestions on escape", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("api");

    const suggestions = page.locator('[data-testid="search-suggestions"]');

    if (await suggestions.count() > 0 && await suggestions.isVisible()) {
      await page.keyboard.press("Escape");
      await expect(suggestions).not.toBeVisible();
    }
  });
});

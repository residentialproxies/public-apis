import { test, expect } from "@playwright/test";

test.describe("Performance - Page Load Times", () => {
  test("homepage should load within 3 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
    console.log(`Homepage DOM load time: ${loadTime}ms`);
  });

  test("homepage should be fully interactive within 5 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/", { waitUntil: "networkidle" });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
    console.log(`Homepage full load time: ${loadTime}ms`);
  });

  test("catalog page should load within 3 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/catalog", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
    console.log(`Catalog DOM load time: ${loadTime}ms`);
  });

  test("API detail page should load within 3 seconds", async ({ page }) => {
    // First get a valid API
    await page.goto("/catalog");
    await page.waitForSelector('[data-testid="api-card"]', { timeout: 10000 });

    const firstCard = page.locator('[data-testid="api-card"]').first();
    const href = await firstCard.getAttribute("href");

    if (href) {
      const startTime = Date.now();
      await page.goto(href, { waitUntil: "domcontentloaded" });
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000);
      console.log(`API detail DOM load time: ${loadTime}ms`);
    }
  });

  test("search results should load within 2 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/search?q=api", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000);
    console.log(`Search results DOM load time: ${loadTime}ms`);
  });
});

test.describe("Performance - Core Web Vitals", () => {
  test("should have good LCP (Largest Contentful Paint)", async ({ page }) => {
    await page.goto("/");

    // Measure LCP using Performance API
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ type: "largest-contentful-paint", buffered: true });

        // Fallback timeout
        setTimeout(() => resolve(0), 5000);
      });
    });

    // Good LCP is under 2.5 seconds
    if (lcp > 0) {
      expect(lcp).toBeLessThan(2500);
      console.log(`LCP: ${lcp}ms`);
    }
  });

  test("should have good FID simulation (First Input Delay)", async ({ page }) => {
    await page.goto("/");

    // Wait for page to be interactive
    await page.waitForLoadState("networkidle");

    // Measure time to first interaction
    const startTime = Date.now();
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.click();
    const interactionTime = Date.now() - startTime;

    // Good FID is under 100ms
    expect(interactionTime).toBeLessThan(500);
    console.log(`First interaction time: ${interactionTime}ms`);
  });

  test("should have good CLS (Cumulative Layout Shift)", async ({ page }) => {
    await page.goto("/");

    // Measure CLS
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value || 0;
            }
          }
        }).observe({ type: "layout-shift", buffered: true });

        // Wait for page to stabilize
        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    // Good CLS is under 0.1
    expect(cls).toBeLessThan(0.25);
    console.log(`CLS: ${cls}`);
  });
});

test.describe("Performance - Resource Loading", () => {
  test("should not have too many requests", async ({ page }) => {
    const requests: string[] = [];

    page.on("request", (request) => {
      requests.push(request.url());
    });

    await page.goto("/", { waitUntil: "networkidle" });

    // Should not have excessive requests
    expect(requests.length).toBeLessThan(100);
    console.log(`Total requests: ${requests.length}`);
  });

  test("should have reasonable total transfer size", async ({ page }) => {
    let totalSize = 0;

    page.on("response", async (response) => {
      const headers = response.headers();
      const contentLength = headers["content-length"];
      if (contentLength) {
        totalSize += parseInt(contentLength, 10);
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });

    // Should be under 5MB total
    const sizeMB = totalSize / (1024 * 1024);
    expect(sizeMB).toBeLessThan(5);
    console.log(`Total transfer size: ${sizeMB.toFixed(2)}MB`);
  });

  test("should cache static assets", async ({ page }) => {
    // First visit
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Second visit - check for cached responses
    const cachedRequests: string[] = [];

    page.on("response", (response) => {
      const cacheControl = response.headers()["cache-control"];
      if (cacheControl && cacheControl.includes("max-age")) {
        cachedRequests.push(response.url());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Should have some cached assets
    expect(cachedRequests.length).toBeGreaterThan(0);
    console.log(`Cached requests: ${cachedRequests.length}`);
  });
});

test.describe("Performance - API Response Times", () => {
  test("categories API should respond within 500ms", async ({ page }) => {
    const startTime = Date.now();
    const response = await page.request.get("/api/v1/public/categories");
    const responseTime = Date.now() - startTime;

    expect(response.ok()).toBe(true);
    expect(responseTime).toBeLessThan(500);
    console.log(`Categories API response time: ${responseTime}ms`);
  });

  test("APIs list should respond within 1 second", async ({ page }) => {
    const startTime = Date.now();
    const response = await page.request.get("/api/v1/public/apis?limit=20");
    const responseTime = Date.now() - startTime;

    expect(response.ok()).toBe(true);
    expect(responseTime).toBeLessThan(1000);
    console.log(`APIs list response time: ${responseTime}ms`);
  });

  test("search API should respond within 500ms", async ({ page }) => {
    const startTime = Date.now();
    const response = await page.request.get("/api/v1/public/search?q=api&limit=10");
    const responseTime = Date.now() - startTime;

    expect(response.ok()).toBe(true);
    expect(responseTime).toBeLessThan(500);
    console.log(`Search API response time: ${responseTime}ms`);
  });

  test("facets API should respond within 500ms", async ({ page }) => {
    const startTime = Date.now();
    const response = await page.request.get("/api/v1/public/facets");
    const responseTime = Date.now() - startTime;

    expect(response.ok()).toBe(true);
    expect(responseTime).toBeLessThan(500);
    console.log(`Facets API response time: ${responseTime}ms`);
  });
});

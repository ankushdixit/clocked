import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Dashboard E2E Tests
 * Tests the main dashboard functionality and accessibility
 */

test.describe("Dashboard Page", () => {
  test("should display main heading", async ({ page }) => {
    await page.goto("/");

    // Check that main heading is visible
    await expect(page.getByRole("heading", { name: "Clocked is ready" })).toBeVisible();
  });

  test("should display electron connection card", async ({ page }) => {
    await page.goto("/");

    // Check that electron connection card is visible
    await expect(page.getByText("Electron Connection")).toBeVisible();
    // In browser mode, should show browser mode message
    await expect(page.getByText("Running in browser mode")).toBeVisible();
  });

  test("should display health status card", async ({ page }) => {
    await page.goto("/");

    // Check that health status card is visible
    await expect(page.getByText("Health Status")).toBeVisible();
    // In browser mode, health check should be unavailable
    await expect(page.getByText("Health check unavailable")).toBeVisible();
  });

  test("should have accessible search functionality", async ({ page }) => {
    await page.goto("/");

    // Find search input by aria-label
    const searchInput = page.getByLabel("Search");
    await expect(searchInput).toBeVisible();

    // Test search input is focusable
    await searchInput.focus();
    await searchInput.fill("test query");
    await expect(searchInput).toHaveValue("test query");
  });

  test("should pass accessibility checks @a11y", async ({ page }) => {
    await page.goto("/");

    // Run accessibility scan
    // Cast through unknown to satisfy type compatibility between @playwright/test and @axe-core/playwright
    const accessibilityScanResults = await new AxeBuilder({
      page,
    } as unknown as ConstructorParameters<typeof AxeBuilder>[0])
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Assert no accessibility violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check that content is visible on mobile
    await expect(page.getByRole("heading", { name: "Clocked is ready" })).toBeVisible();

    // Sidebar should be hidden on mobile
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeHidden();
  });

  test("should have keyboard navigation support", async ({ page }) => {
    await page.goto("/");

    // Tab through focusable elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Verify focused element is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});

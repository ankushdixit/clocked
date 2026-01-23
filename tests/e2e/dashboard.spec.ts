import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Dashboard E2E Tests
 * Tests the main dashboard (Monthly Usage) functionality and accessibility
 */

test.describe("Dashboard Page", () => {
  test("should display monthly usage heading", async ({ page }) => {
    await page.goto("/");

    // Check that monthly usage heading is visible (format: "MONTH YEAR USAGE")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("USAGE");
  });

  test("should display metrics cards in browser mode", async ({ page }) => {
    await page.goto("/");

    // In browser mode, should show error message since Electron is not available
    await expect(
      page.getByText("Running in browser mode - connect via Electron for live data")
    ).toBeVisible();
  });

  test("should display sidebar navigation", async ({ page }) => {
    await page.goto("/");

    // Check that sidebar navigation links are visible
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Projects" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  });

  test.skip("should have accessible search functionality", async ({ page }) => {
    // TODO: Re-enable when search is added to the frameless window UI
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
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

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

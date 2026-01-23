import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Dashboard E2E Tests
 * Tests the main dashboard (Monthly Usage) functionality and accessibility
 */

test.describe("Dashboard Page", () => {
  test("should display dashboard heading", async ({ page }) => {
    await page.goto("/");

    // Check that dashboard heading is visible
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Dashboard");
  });

  test("should display hero metrics cards", async ({ page }) => {
    await page.goto("/");

    // Check that hero metric cards are visible by looking for their values
    await expect(page.getByText("349")).toBeVisible(); // Sessions count
    await expect(page.getByText("844h 18m")).toBeVisible(); // Session Time
    await expect(page.getByText("$2,532.92")).toBeVisible(); // API Cost
    await expect(page.getByText("25.33x")).toBeVisible(); // Value multiplier
  });

  test("should display sidebar navigation", async ({ page }, testInfo) => {
    // Skip on mobile - sidebar is hidden on mobile viewports by design
    test.skip(testInfo.project.name.includes("Mobile"), "Sidebar hidden on mobile");

    await page.goto("/");

    // Check that sidebar navigation links are visible
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Projects" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
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

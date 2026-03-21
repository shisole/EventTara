import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("quiz_completed", "true"));
});

test.describe("Clubs", () => {
  test("clubs page loads and shows club cards", async ({ page }) => {
    await page.goto("/clubs");

    // Page heading is visible
    await expect(page.locator("h1")).toContainText(/clubs/i);

    // At least one club card link is visible (seeded data)
    const clubCard = page.getByRole("link").filter({ hasText: /.+/ }).first();
    await expect(clubCard).toBeVisible({ timeout: 10_000 });
  });

  test("clicking a club card navigates to club detail page", async ({ page }) => {
    await page.goto("/clubs");

    // Wait for club cards to load, then click the first one
    const firstClubLink = page
      .locator('a[href^="/clubs/"]')
      .filter({ hasNotText: /join/i })
      .first();
    await expect(firstClubLink).toBeVisible({ timeout: 10_000 });

    await firstClubLink.click();

    // Should navigate to a club detail page
    await expect(page).toHaveURL(/\/clubs\/[^/]+$/, { timeout: 10_000 });

    // Club detail page should have a heading
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10_000 });
  });
});

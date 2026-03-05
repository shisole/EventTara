import { test, expect } from "@playwright/test";

test.describe("Events listing page", () => {
  test("loads and shows event cards", async ({ page }) => {
    await page.goto("/events");

    // Page title or heading is visible
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // At least one event card link should exist
    const eventLinks = page.locator('a[href^="/events/"]');
    await expect(eventLinks.first()).toBeVisible();
  });

  test("clicking an event card navigates to detail page", async ({ page }) => {
    await page.goto("/events");

    // Click the first event card link
    const firstEventLink = page.locator('a[href^="/events/"]').first();
    await expect(firstEventLink).toBeVisible();

    const href = await firstEventLink.getAttribute("href");
    await firstEventLink.click();

    await expect(page).toHaveURL(href!);
  });
});

test.describe("Event detail page", () => {
  test("shows event information", async ({ page }) => {
    // Navigate to events listing first to get a real event URL
    await page.goto("/events");

    const firstEventLink = page.locator('a[href^="/events/"]').first();
    await expect(firstEventLink).toBeVisible();
    await firstEventLink.click();

    // Event detail page should have a heading (event title)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Should show "adventurer" text (from LiveBookingCount)
    await expect(page.getByText(/adventurer/)).toBeVisible();
  });
});

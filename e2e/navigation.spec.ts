import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("navbar logo links to homepage", async ({ page }) => {
    await page.goto("/events");

    // Click the logo/brand link
    const logo = page.getByRole("link", { name: /eventtara/i }).first();
    await expect(logo).toBeVisible();
    await logo.click();

    await expect(page).toHaveURL("/");
  });

  test("can navigate from homepage to events and back", async ({ page }) => {
    await page.goto("/");

    // Navigate to events
    const exploreLink = page.getByRole("link", { name: /explore events/i }).first();
    await expect(exploreLink).toBeVisible();
    await exploreLink.click({ force: true });

    await expect(page).toHaveURL("/events");

    // Navigate back via browser
    await page.goBack();
    await expect(page).toHaveURL("/");
  });
});

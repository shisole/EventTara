import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Dismiss onboarding quiz modal that blocks interaction in fresh sessions
  await page.addInitScript(() => localStorage.setItem("quiz_completed", "true"));
});

test.describe("Navigation", () => {
  test("navbar logo links to homepage", async ({ page }) => {
    await page.goto("/events");

    // Click the logo/brand link
    const logo = page.getByRole("link", { name: /eventtara/i }).first();
    await expect(logo).toBeVisible();
    await logo.click();

    await expect(page).toHaveURL("/");
  });

  test("clubs link navigates to /clubs", async ({ page }) => {
    await page.goto("/");

    const clubsLink = page.getByRole("link", { name: /clubs/i }).first();
    await expect(clubsLink).toBeVisible();
    await clubsLink.click();

    await expect(page).toHaveURL("/clubs", { timeout: 10000 });
  });

  test("can navigate from homepage to events and back", async ({ page }) => {
    await page.goto("/");

    // Navigate to events via the hero CTA link
    const exploreLink = page.getByRole("link", { name: /explore events/i }).first();
    await expect(exploreLink).toBeVisible();
    await exploreLink.click();

    await expect(page).toHaveURL("/events", { timeout: 10000 });

    // Navigate back via browser
    await page.goBack();
    await expect(page).toHaveURL("/");
  });
});

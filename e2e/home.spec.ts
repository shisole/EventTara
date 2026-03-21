import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Dismiss onboarding quiz modal that blocks interaction in fresh sessions
  await page.addInitScript(() => localStorage.setItem("quiz_completed", "true"));
});

test("homepage loads and shows key content", async ({ page }) => {
  await page.goto("/");

  // Main heading is visible
  await expect(page.locator("h1")).toContainText(/Every Great Adventure/);

  // "Explore Events" link is visible and points to /events
  const exploreLink = page.getByRole("link", { name: /explore events/i }).first();
  await expect(exploreLink).toBeVisible();

  // "Start a Club" CTA is visible
  const startClubLink = page.getByRole("link", { name: /start a club/i }).first();
  await expect(startClubLink).toBeVisible();
});

test('"Explore Events" navigates to events page', async ({ page }) => {
  await page.goto("/");

  const exploreLink = page.getByRole("link", { name: /explore events/i }).first();
  await expect(exploreLink).toHaveAttribute("href", "/events");
  await exploreLink.click();

  await expect(page).toHaveURL("/events", { timeout: 10000 });
});

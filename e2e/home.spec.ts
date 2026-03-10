import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Dismiss onboarding quiz modal that blocks interaction in fresh sessions
  await page.addInitScript(() => localStorage.setItem("quiz_completed", "true"));
});

test("homepage loads and shows key content", async ({ page }) => {
  await page.goto("/");

  // Main heading is visible
  await expect(page.locator("h1")).toContainText("Tara na!");

  // "Explore Events" link is visible and points to /events
  const exploreLink = page.getByRole("link", { name: /explore events/i }).first();
  await expect(exploreLink).toBeVisible();

  // "How It Works" section is present
  await expect(page.getByText("How It Works")).toBeVisible();
});

test('"Explore Events" navigates to events page', async ({ page }) => {
  await page.goto("/");

  // Wait for splash screen to clear (z-[100] overlay, ~400ms)
  await page
    .locator(String.raw`.z-\[100\]`)
    .waitFor({ state: "hidden", timeout: 5000 })
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    .catch(() => {});

  const exploreLink = page.getByRole("link", { name: /explore events/i }).first();
  await expect(exploreLink).toHaveAttribute("href", "/events");
  await exploreLink.click();

  await expect(page).toHaveURL("/events", { timeout: 10000 });
});

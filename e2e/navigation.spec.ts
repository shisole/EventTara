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

    // Wait for splash screen to clear (z-[100] overlay, ~400ms)
    await page
      .locator(String.raw`.z-\[100\]`)
      .waitFor({ state: "hidden", timeout: 5000 })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {});

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

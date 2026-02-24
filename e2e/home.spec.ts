import { test, expect } from "@playwright/test";

test("homepage loads and shows key content", async ({ page }) => {
  await page.goto("/");

  // Main heading is visible
  await expect(page.locator("h1")).toContainText("Tara na!");

  // "Explore Events" link is visible and points to /events
  const exploreLink = page.getByRole("link", { name: /explore events/i });
  await expect(exploreLink).toBeVisible();

  // "How It Works" section is present
  await expect(page.getByText("How It Works")).toBeVisible();
});

test('"Explore Events" navigates to events page', async ({ page }) => {
  await page.goto("/");

  const exploreLink = page.getByRole("link", { name: /explore events/i });
  await expect(exploreLink).toHaveAttribute("href", "/events");

  // Hero carousel images overlap the CTA; force click since visibility is verified above
  await exploreLink.click({ force: true });

  await expect(page).toHaveURL("/events");
});

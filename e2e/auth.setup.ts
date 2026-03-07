import { type Page, test as setup, expect } from "@playwright/test";

const ORGANIZER = {
  email: "organizer1@test.eventtara.com",
  password: "TestPass123!",
  storageState: "e2e/.auth/organizer.json",
};

const PARTICIPANT = {
  email: "participant1@test.eventtara.com",
  password: "TestPass123!",
  storageState: "e2e/.auth/participant.json",
};

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.locator("form").getByRole("button", { name: "Sign In", exact: true }).click();

  // Wait for redirect away from login page
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
}

setup("authenticate organizer", async ({ page }) => {
  await login(page, ORGANIZER.email, ORGANIZER.password);
  await page.context().storageState({ path: ORGANIZER.storageState });
});

setup("authenticate participant", async ({ page }) => {
  await login(page, PARTICIPANT.email, PARTICIPANT.password);
  await page.context().storageState({ path: PARTICIPANT.storageState });
});

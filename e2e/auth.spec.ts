import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("loads and shows login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /log in|sign in|welcome/i })).toBeVisible();

    // Should have email input
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("has link to signup", async ({ page }) => {
    await page.goto("/login");

    const signupLink = page.getByRole("link", { name: /sign up|create account|register/i });
    await expect(signupLink).toBeVisible();
  });
});

test.describe("Signup page", () => {
  test("loads and shows signup form", async ({ page }) => {
    await page.goto("/signup");

    await expect(
      page.getByRole("heading", { name: /sign up|create|register|join/i }),
    ).toBeVisible();

    // Should have email input
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("has link to login", async ({ page }) => {
    await page.goto("/signup");

    const loginLink = page.getByRole("link", { name: /log in|sign in/i });
    await expect(loginLink).toBeVisible();
  });
});

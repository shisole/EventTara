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

    // "Don't have an account? Sign Up" — scoped to main content (not navbar)
    const signupLink = page
      .getByRole("paragraph")
      .filter({ hasText: /don't have an account/i })
      .getByRole("link");
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

    // "Already have an account? Sign In" — scoped to main content (not navbar)
    const loginLink = page
      .getByRole("paragraph")
      .filter({ hasText: /already have an account/i })
      .getByRole("link");
    await expect(loginLink).toBeVisible();
  });
});

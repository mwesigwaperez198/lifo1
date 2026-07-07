import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and shows the LifeOS brand", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LifeOS/);
  });

  test("has a get started or login link", async ({ page }) => {
    await page.goto("/");
    const links = page.getByRole("link");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Auth pages", () => {
  test("login page renders form fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("register page renders form fields", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("button", { name: /create|sign up|register/i })).toBeVisible();
  });

  test("forgot password page renders", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: /send reset/i })).toBeVisible();
  });
});

test.describe("Health API", () => {
  test("returns 200 from health endpoint", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
  });
});

import { test, expect } from "@playwright/test";
import { field } from "./utils";

test.describe("Account gating", () => {
  test("visiting /account while signed out redirects to /account/login", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/account\/login/, { timeout: 5000 });
  });
});

test.describe("Login", () => {
  test("wrong password shows a generic error and does not navigate", async ({ page }) => {
    await page.goto("/account/login");
    await field(page, "E-mail").fill("beena.parmar@example.com");
    await field(page, "Password").fill("wrong");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText(/incorrect/i)).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/account\/login/);
  });
});

test.describe("Register", () => {
  test("password under 8 characters is rejected client-side", async ({ page }) => {
    const unique = `e2e.${Date.now()}@example.com`;
    await page.goto("/account/register");
    await field(page, "Full name").fill("Test User");
    await field(page, "E-mail").fill(unique);
    await field(page, "Phone").fill("9000000000");
    await field(page, "Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/account\/register/);
    await expect(page.getByText(/8 characters/i).first()).toBeVisible();
  });

  test("a new account redirects to /account and greets the customer", async ({ page }) => {
    const unique = `e2e.${Date.now()}@example.com`;
    await page.goto("/account/register");
    await field(page, "Full name").fill("Test User");
    await field(page, "E-mail").fill(unique);
    await field(page, "Phone").fill("9000000000");
    await field(page, "Password").fill("a-strong-password");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/account$/, { timeout: 8000 });
    await expect(page.getByText(/hello, test/i)).toBeVisible();
  });

  test("registering an already-registered e-mail is rejected", async ({ page }) => {
    await page.goto("/account/register");
    await field(page, "Full name").fill("Beena Parmar");
    await field(page, "E-mail").fill("beena.parmar@example.com"); // seeded, already registered
    await field(page, "Phone").fill("9800000012");
    await field(page, "Password").fill("a-strong-password");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(/already exists|already registered|email.*taken/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/account\/register/);
  });
});

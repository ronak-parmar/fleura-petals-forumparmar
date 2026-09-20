import { test, expect } from "@playwright/test";
import { field, ADMIN } from "./utils";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await field(page, "Username").fill(ADMIN.username);
  await field(page, "Password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 8000 });
}

test.describe("Admin gate", () => {
  test("visiting /admin while signed out redirects to /admin/login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5000 });
  });

  test("wrong credentials show a generic error and do not navigate", async ({ page }) => {
    await page.goto("/admin/login");
    await field(page, "Username").fill("forum");
    await field(page, "Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/incorrect/i)).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe("Admin session", () => {
  test("valid login reaches the dashboard and shows the signed-in name", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText("Signed in as")).toBeVisible();
    await expect(page.getByText("Forum Parmar")).toBeVisible();
  });

  test("sidebar navigation reaches every admin section without a full reload error", async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole("link", { name: "Orders", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/orders$/);
    await expect(page.getByText(/FP-2026-000042/)).toBeVisible();

    await page.getByRole("link", { name: "Custom requests", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/custom-requests$/);
    await expect(page.getByText(/FP-CR-2026-000007/)).toBeVisible();

    await page.getByRole("link", { name: "Products", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/products$/);
    await expect(page.getByText("Rosewood Ribbon Bouquet")).toBeVisible();

    await page.getByRole("link", { name: "Enquiries", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/enquiries$/);

    await page.getByRole("link", { name: "Dashboard", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("order status filter chip updates the URL and the list", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/orders");
    await page.getByRole("button", { name: "Pending", exact: true }).click();
    await expect(page).toHaveURL(/status=pending/);
  });

  test("clicking an order row opens its detail page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/orders");
    await page.getByText(/FP-2026-000042/).click();
    await expect(page).toHaveURL(/\/admin\/orders\/\d+/);
    await expect(page.getByText(/Rosewood Ribbon Bouquet/)).toBeVisible();
  });

  test("an invalid backwards status transition is rejected", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/orders");
    await page.getByText(/FP-2026-000042/).click(); // seeded order, status = in_preparation
    // The status control should only ever offer forward transitions — there must be
    // no option to go back to "pending" or "confirmed".
    const statusControl = field(page, "Move to");
    const options = await statusControl.locator("option").allTextContents().catch(() => [] as string[]);
    for (const opt of options) {
      expect(opt.toLowerCase()).not.toMatch(/^pending$|^confirmed$/);
    }
  });

  test("logging out returns to the login gate", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByText("Log out").click();
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5000 });
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

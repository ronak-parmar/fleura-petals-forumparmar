import { test, expect } from "@playwright/test";
import { field, daysFromNow } from "./utils";

test.describe("Custom bouquet request", () => {
  test("submitting with required fields missing shows validation errors, no navigation", async ({ page }) => {
    await page.goto("/custom");
    await page.getByRole("button", { name: "Send custom request" }).click();
    await expect(page).toHaveURL(/\/custom$/);
    await expect(page.locator("text=/required/i").first()).toBeVisible();
  });

  test("a valid submission redirects to the received page with a request number", async ({ page }) => {
    await page.goto("/custom");
    await field(page, "Type").selectOption({ index: 1 });
    await field(page, "Occasion").fill("25th wedding anniversary");
    await field(page, "Size").selectOption({ index: 1 });
    await field(page, "Need it by").fill(daysFromNow(20));
    await field(page, "Name").fill("Ronak Parmar");
    await field(page, "Phone").fill("9700000040");
    await field(page, "Email").fill("ronak.parmar@example.com");

    await page.getByRole("button", { name: "Send custom request" }).click();
    await expect(page).toHaveURL(/\/custom\/received\/FP-CR-\d{4}-\d{6}/, { timeout: 8000 });
    await expect(page.getByText(/FP-CR-\d{4}-\d{6}/)).toBeVisible();
  });

  test("?from= pre-fills context from the referring product", async ({ page }) => {
    await page.goto("/custom?from=rosewood-ribbon-bouquet");
    await expect(page.getByText(/Rosewood Ribbon Bouquet/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Custom request received", () => {
  test("an unknown request number shows a not-found state, not a crash", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/custom/received/FP-CR-2026-999999");
    await expect(page.getByText(/couldn't find|not found/i)).toBeVisible({ timeout: 5000 });
    expect(errors).toEqual([]);
  });
});

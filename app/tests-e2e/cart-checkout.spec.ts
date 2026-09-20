import { test, expect } from "@playwright/test";
import { field, daysFromNow, loginAsCustomer } from "./utils";

async function addFreshBunchToCart(page: import("@playwright/test").Page) {
  await loginAsCustomer(page);
  await page.goto("/shop/morning-market-fresh-bunch");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText(/Cart · [1-9]/)).toBeVisible();
}

test.describe("Cart", () => {
  test("empty cart shows an empty state and no checkout button", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByText(/cart is empty/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /proceed to checkout/i })).toHaveCount(0);
  });

  test("added item appears, quantity updates, remove empties the cart", async ({ page }) => {
    await addFreshBunchToCart(page);
    await page.goto("/cart");
    await expect(page.getByText("Morning Market Fresh Bunch")).toBeVisible();

    const plus = page.getByRole("button", { name: /increase quantity/i }).first();
    await plus.click();
    await expect(page.getByText("₹1,800").first()).toBeVisible(); // 2 × ₹900

    const removeBtn = page.getByRole("button", { name: /remove/i }).first();
    await removeBtn.click();
    await expect(page.getByText(/cart is empty/i)).toBeVisible();
  });
});

test.describe("Checkout", () => {
  test("visiting checkout with an empty cart redirects to /cart", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/cart$/, { timeout: 5000 });
  });

  test("submitting an empty checkout form shows validation errors and does not navigate", async ({ page }) => {
    await addFreshBunchToCart(page);
    await page.goto("/checkout");
    await field(page, "Full name").fill("");
    await page.getByRole("button", { name: "Place order" }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    // At least one inline error should now be visible.
    await expect(page.locator("text=/required|enter/i").first()).toBeVisible();
  });

  test("a valid order redirects to the confirmation page with an order number", async ({ page }) => {
    await addFreshBunchToCart(page);
    await page.goto("/checkout");

    await field(page, "Full name").fill("Beena Parmar");
    await field(page, "Phone").first().fill("9800000012");
    await field(page, "Email").fill("beena.parmar@example.com");
    await field(page, "Recipient name").fill("Beena Parmar");
    await field(page, "Address line 1").fill("14, Rose Villa, Linking Road");
    await field(page, "City").fill("Mumbai");
    await field(page, "PIN code").fill("400052");
    await field(page, "Date").fill(daysFromNow(5));

    await page.getByRole("button", { name: "Place order" }).click();
    await expect(page).toHaveURL(/\/order\/confirmed\/FP-\d{4}-\d{6}/, { timeout: 8000 });
    await expect(page.getByText(/FP-\d{4}-\d{6}/)).toBeVisible();
    // Cart should be cleared after a successful order.
    await page.goto("/cart");
    await expect(page.getByText(/cart is empty/i)).toBeVisible();
  });

  test("an everlasting item rejects a delivery date sooner than its lead time", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/shop/sage-garden-silk-bouquet"); // 7-day lead time
    await page.getByRole("button", { name: "Add to cart" }).click();
    await page.goto("/checkout");

    await field(page, "Full name").fill("Beena Parmar");
    await field(page, "Phone").first().fill("9800000012");
    await field(page, "Email").fill("beena.parmar@example.com");
    await field(page, "Recipient name").fill("Beena Parmar");
    await field(page, "Address line 1").fill("14, Rose Villa, Linking Road");
    await field(page, "City").fill("Mumbai");
    await field(page, "PIN code").fill("400052");
    await field(page, "Date").fill(daysFromNow(1)); // too soon for a 7-day lead item

    await page.getByRole("button", { name: "Place order" }).click();
    // Must NOT reach confirmation — either blocked client-side or by the mock API's
    // DELIVERY_TOO_SOON rule.
    await expect(page).not.toHaveURL(/\/order\/confirmed/);
  });
});

test.describe("Track order", () => {
  test("the seeded order tracks successfully", async ({ page }) => {
    await page.goto("/track");
    await field(page, "Order number").fill("FP-2026-000042");
    await field(page, "E-mail").fill("beena.parmar@example.com");
    await page.getByRole("button", { name: /track/i }).last().click();
    await expect(page.getByText(/in preparation|confirmed|pending/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("wrong e-mail for a real order number gives a generic not-found, not a data leak", async ({ page }) => {
    await page.goto("/track");
    await field(page, "Order number").fill("FP-2026-000042");
    await field(page, "E-mail").fill("someone.else@example.com");
    await page.getByRole("button", { name: /track/i }).last().click();
    await expect(page.getByText(/couldn't find|no order/i)).toBeVisible({ timeout: 5000 });
  });
});

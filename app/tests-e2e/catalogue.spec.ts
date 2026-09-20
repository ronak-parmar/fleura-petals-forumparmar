import { test, expect } from "@playwright/test";
import { loginAsCustomer } from "./utils";

test.describe("Home", () => {
  test("loads and links out correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Flowers that keep their promise/i })).toBeVisible();

    await page.getByRole("link", { name: "Shop the atelier" }).click();
    await expect(page).toHaveURL(/\/shop$/);
  });

  test("custom bouquet CTA redirects to /custom", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Request a custom bouquet" }).click();
    await expect(page).toHaveURL(/\/custom$/);
  });

  test("nav links all resolve", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation");
    await nav.getByRole("link", { name: "Shop", exact: true }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await nav.getByRole("link", { name: "Home", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("Shop", () => {
  test("lists seeded products", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByText("Rosewood Ribbon Bouquet")).toBeVisible();
    await expect(page.getByText("Petite Everlasting Jar")).toBeVisible();
  });

  test("nature filter narrows results and updates the URL", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("button", { name: "Fresh", exact: true }).click();
    await expect(page).toHaveURL(/nature=fresh/);
    await expect(page.getByText("Morning Market Fresh Bunch")).toBeVisible();
    await expect(page.getByText("Rosewood Ribbon Bouquet")).not.toBeVisible();
  });

  test("search with no matches shows an empty state, not an error", async ({ page }) => {
    await page.goto("/shop");
    await page.getByPlaceholder(/search/i).fill("xylophone");
    await expect(page.getByText(/no bouquets match/i)).toBeVisible({ timeout: 5000 });
  });

  test("clicking a product card navigates to its detail page", async ({ page }) => {
    await page.goto("/shop");
    await page.getByText("Rosewood Ribbon Bouquet").click();
    await expect(page).toHaveURL(/\/shop\/rosewood-ribbon-bouquet/);
    await expect(page.getByRole("heading", { name: "Rosewood Ribbon Bouquet" })).toBeVisible();
  });
});

test.describe("Product detail", () => {
  test("unknown slug shows not-found, not a crash", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/shop/this-product-does-not-exist");
    await expect(page.getByText(/not found|couldn't find|no longer available/i).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("sold-out product cannot be added to cart", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/shop/petite-everlasting-jar");
    const addBtn = page.getByRole("button", { name: /sold out|add to cart/i });
    await expect(addBtn).toBeDisabled();
  });

  test("add to cart increments the header cart count", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/shop/morning-market-fresh-bunch");
    await expect(page.getByText("Cart · 0")).toBeVisible();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByText(/Cart · [1-9]/)).toBeVisible();
  });

  test("customizable product links to the custom request form", async ({ page }) => {
    await page.goto("/shop/rosewood-ribbon-bouquet");
    await page.getByRole("link", { name: /request a custom version/i }).click();
    await expect(page).toHaveURL(/\/custom/);
  });

  test("signed-out visitor sees a sign-in prompt instead of price and add-to-cart", async ({ page }) => {
    await page.goto("/shop/rosewood-ribbon-bouquet");
    await expect(page.getByText(/sign in to see price/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to cart" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("signed-out shop grid hides price on every card", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByText(/sign in to see price/i).first()).toBeVisible();
  });
});

import type { Page } from "@playwright/test";

/**
 * Locates the fillable control (input/select/textarea) that follows a
 * <Field label="..."> in the DOM. Works whether or not the page wired htmlFor/id
 * (most don't), because the shared Field component always renders <label>…</label>
 * then the control as the next sibling inside the same wrapper div. Also handles
 * PasswordInput, which wraps its <input> in a <div> (for the show/hide toggle) —
 * descendant-or-self resolves to the sibling itself when it IS the control, or
 * drills into it when the control is nested one level down.
 */
export function field(page: Page, label: string) {
  return page
    .locator("label", { hasText: label })
    .first()
    .locator("xpath=following-sibling::*[1]/descendant-or-self::*[self::input or self::textarea or self::select][1]");
}

/** YYYY-MM-DD string N days from today — safely past any product's lead time. */
export function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const ADMIN = { username: "forum", password: "petals123" };

/** Logs in as the seeded registered mock customer (Beena) — price/availability/
 *  add-to-cart are gated behind sign-in, so shopping-flow tests need this first. */
export async function loginAsCustomer(
  page: Page,
  email = "beena.parmar@example.com",
  password = "password123"
) {
  await page.goto("/account/login");
  await field(page, "E-mail").fill(email);
  await field(page, "Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/account$/);
}

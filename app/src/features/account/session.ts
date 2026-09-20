"use client";

import { useState } from "react";

/** Minimal client-side customer session store (mock auth — see lib/api/client.ts). */
const KEY = "fleurea-customer-token";

export function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setCustomerToken(token: string) {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearCustomerToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** True once, read synchronously at mount (matches the lazy-init pattern used
 *  to fix the account-page session race — see CLAUDE.md). Used to gate price/
 *  availability/add-to-cart display for signed-out visitors. */
export function useIsCustomerSignedIn(): boolean {
  const [signedIn] = useState<boolean>(() => getCustomerToken() !== null);
  return signedIn;
}

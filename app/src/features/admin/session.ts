"use client";

/** Minimal client-side admin session store (mock auth — see lib/api/client.ts). */
const KEY = "fleurea-admin-token";
const NAME_KEY = "fleurea-admin-name";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setAdminSession(token: string, name: string) {
  try {
    localStorage.setItem(KEY, token);
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* ignore */
  }
}

export function getAdminName(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearAdminSession() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(NAME_KEY);
  } catch {
    /* ignore */
  }
}

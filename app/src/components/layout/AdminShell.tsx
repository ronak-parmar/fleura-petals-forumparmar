"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearAdminSession, getAdminName, getAdminToken } from "@/features/admin/session";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/custom-requests", label: "Custom requests" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/enquiries", label: "Enquiries" },
];

/**
 * Wraps every /admin/* page except /admin/login. Redirects to /admin/login
 * when there's no session token, and renders the sidebar + "signed in as".
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    setName(getAdminName());
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr] bg-ivory">
      <aside className="bg-ink px-4.5 py-6 text-[#e9d9cf]">
        <div className="mb-6.5 font-display text-lg italic text-[#f2ddd0]">Fleuréa · Studio</div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2.5 text-sm ${active ? "bg-white/10 text-white" : "text-[#d3b9ac] hover:text-white"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 border-t border-white/10 pt-4 text-xs text-[#b09a8d]">
          Signed in as <b className="font-semibold text-[#e9d9cf]">{name || "Admin"}</b>
        </div>
        <button
          onClick={() => {
            clearAdminSession();
            router.replace("/admin/login");
          }}
          className="mt-2 text-sm text-[#d3b9ac] hover:text-white"
        >
          Log out
        </button>
      </aside>
      <main className="px-6 py-7 sm:px-8">{children}</main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./BrandMark";
import { useCart } from "@/features/cart/CartContext";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/custom", label: "Custom" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4 sm:px-11">
      <BrandMark />
      <nav className="hidden gap-6 text-sm text-text-muted md:flex">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? "border-b-2 border-rosewood pb-0.5 text-ink" : "hover:text-ink"}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-4 text-sm text-text-muted">
        <Link href="/track" className="hidden sm:inline hover:text-ink">
          Track order
        </Link>
        <Link href="/account" className="hidden sm:inline hover:text-ink">
          Account
        </Link>
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 rounded-full bg-rosewood px-3.5 py-1.5 text-xs font-semibold text-white"
        >
          Cart · {count}
        </Link>
      </div>
    </header>
  );
}

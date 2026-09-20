"use client";

import Link from "next/link";
import type { Product } from "@/lib/api/types";
import { PriceTag } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { useIsCustomerSignedIn } from "@/features/account/session";

const NATURE_LABEL: Record<Product["nature"], string> = {
  everlasting: "Everlasting",
  fresh: "Fresh",
};

export function ProductCard({ product }: { product: Product }) {
  const signedIn = useIsCustomerSignedIn();

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="block overflow-hidden rounded-card border border-border bg-surface transition-shadow hover:shadow-md"
    >
      <div
        className="flex h-[180px] items-end bg-linear-to-br from-blush via-[#e7c7bb] to-sage bg-cover bg-center p-3"
        style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}
      >
        <span className="rounded-md bg-surface/85 px-2 py-1 font-mono text-[10px] tracking-wide text-ink uppercase">
          {product.category}
        </span>
      </div>
      <div className="px-4 py-4">
        <div className="font-display text-lg text-ink">{product.name}</div>
        <div className="mb-2.5 text-xs text-text-muted">
          {NATURE_LABEL[product.nature]} · {product.nature === "everlasting" ? `${product.leadTimeDays}-day lead` : "same-day"}
        </div>
        {signedIn ? (
          <div className="flex items-center justify-between">
            <PriceTag amount={product.price} />
            {product.availability === "sold_out" && <Badge variant="dang">Sold out</Badge>}
            {product.availability === "made_to_order" && <Badge variant="warn">Made to order</Badge>}
            {product.availability === "available" && <Badge variant="ok">Available</Badge>}
          </div>
        ) : (
          <span className="text-xs font-semibold text-rosewood">Sign in to see price</span>
        )}
      </div>
    </Link>
  );
}

"use client";

import { useMemo } from "react";
import { useCart } from "@/features/cart/CartContext";
import { useAsync } from "@/lib/useAsync";
import * as client from "@/lib/api/client";
import type { Product } from "@/lib/api/types";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { PriceTag, Eyebrow, EmptyState } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";

interface RevalidationResult {
  slug: string;
  product: Product | null;
  soldOut: boolean;
  notFound: boolean;
}

export default function CartPage() {
  const cart = useCart();
  const { lines, count, subtotal, deliveryFee, total, setQty, remove } = cart;

  // P4-L4: re-check every line's price + availability against the API on open.
  const slugsKey = lines.map((l) => l.slug).join("|");
  const { data: revalidation } = useAsync(async () => {
    const results = await Promise.all(
      lines.map(async (line): Promise<RevalidationResult> => {
        try {
          const product = await client.getProduct(line.slug);
          return { slug: line.slug, product, soldOut: product.availability === "sold_out", notFound: false };
        } catch {
          return { slug: line.slug, product: null, soldOut: false, notFound: true };
        }
      })
    );
    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugsKey]);

  const revalidationMap = useMemo(() => {
    const map = new Map<string, RevalidationResult>();
    (revalidation ?? []).forEach((r) => map.set(r.slug, r));
    return map;
  }, [revalidation]);

  const hasBlockedLine = lines.some((l) => {
    const r = revalidationMap.get(l.slug);
    return r ? r.notFound || r.soldOut : false;
  });

  const canCheckout = lines.length > 0 && !hasBlockedLine;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:px-11 sm:py-14">
        <Eyebrow>Your cart</Eyebrow>
        <h1 className="mb-6 font-display text-[2rem] text-ink">
          {lines.length === 0 ? "Your cart" : `${count} item${count === 1 ? "" : "s"}`}
        </h1>

        {lines.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            body="Browse the atelier to find ribbon-wound blooms and fresh seasonal arrangements."
            action={<Button href="/shop">Browse the shop</Button>}
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div>
              {lines.map((line) => {
                const rev = revalidationMap.get(line.slug);
                const flagged = rev ? rev.notFound || rev.soldOut : false;
                const priceChanged = !flagged && !!rev?.product && rev.product.price !== line.price;

                return (
                  <div key={line.productId} className="flex gap-4 border-b border-border py-4 last:border-b-0">
                    {line.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.imageUrl}
                        alt=""
                        className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-linear-to-br from-blush via-[#e7c7bb] to-sage" />
                    )}
                    <div className="flex-1">
                      <div className="font-display text-base text-ink">{line.name}</div>
                      <div className="text-[12.5px] text-text-muted">
                        {line.nature === "everlasting" ? "Everlasting" : "Fresh"} ·{" "}
                        {line.nature === "everlasting"
                          ? `${line.leadTimeDays}-day lead time`
                          : "same-day, delivered the morning of"}
                      </div>

                      {flagged && (
                        <div className="mt-1.5">
                          <Badge variant="dang">{rev?.notFound ? "No longer available" : "Sold out"}</Badge>
                        </div>
                      )}
                      {priceChanged && rev?.product && (
                        <p className="mt-1 text-xs text-warn-fg">
                          Price updated to ₹{rev.product.price.toLocaleString("en-IN")}
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center gap-4">
                        <QtyStepper value={line.quantity} onChange={(next) => setQty(line.productId, next)} />
                        <button
                          type="button"
                          onClick={() => remove(line.productId)}
                          className="text-[12.5px] text-text-muted hover:text-ink hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <PriceTag amount={line.price * line.quantity} />
                  </div>
                );
              })}
            </div>

            <div className="h-max rounded-card border border-border bg-surface-2 p-5.5">
              <h3 className="mb-3 font-display text-lg text-ink">Summary</h3>
              <div className="flex justify-between py-1.5 text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm">
                <span>Delivery</span>
                <span>Free over ₹1,500</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm text-text-muted">
                <span>Estimated delivery fee</span>
                <span>₹{deliveryFee.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border-strong pt-3 text-base font-bold">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>

              {hasBlockedLine && (
                <p className="mt-3 text-xs text-dang-fg">
                  Remove the flagged item(s) above before checking out.
                </p>
              )}

              {canCheckout ? (
                <Button href="/checkout" block className="mt-4">
                  Proceed to checkout
                </Button>
              ) : (
                <Button block disabled className="mt-4">
                  Proceed to checkout
                </Button>
              )}
              <Button href="/shop" variant="ghost" block className="mt-2.5">
                Continue shopping
              </Button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

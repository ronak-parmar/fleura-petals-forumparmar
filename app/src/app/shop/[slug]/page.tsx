"use client";

import { use, useState } from "react";
import Link from "next/link";
import * as client from "@/lib/api/client";
import { useAsync, isApiError } from "@/lib/useAsync";
import { useCart } from "@/features/cart/CartContext";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { Card, CardTitle } from "@/components/ui/Card";
import { Eyebrow, PriceTag, ErrorBanner, EmptyState } from "@/components/ui/Misc";
import { useIsCustomerSignedIn } from "@/features/account/session";

const NATURE_LABEL: Record<"everlasting" | "fresh", string> = {
  everlasting: "Everlasting",
  fresh: "Fresh",
};

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const cart = useCart();
  const signedIn = useIsCustomerSignedIn();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const { data: product, error, loading } = useAsync(() => client.getProduct(slug), [slug]);

  const notFound = isApiError(error) && error.status === 404;

  function handleAddToCart() {
    if (!product || product.availability === "sold_out") return;
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      nature: product.nature,
      leadTimeDays: product.leadTimeDays,
      quantity: qty,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-12 sm:px-11">
        {loading && <p className="text-text-muted">Loading&hellip;</p>}

        {!loading && error && notFound && (
          <EmptyState
            title="We couldn't find that bouquet"
            body="It may have been removed, sold out permanently, or the link is out of date."
            action={<Button href="/shop">Back to shop</Button>}
          />
        )}

        {!loading && error && !notFound && (
          <ErrorBanner
            message={isApiError(error) ? error.message : "Something went wrong. Please try again."}
          />
        )}

        {!loading && product && (
          <>
            <p className="mb-4.5 text-xs text-text-muted">
              <Link href="/shop" className="hover:text-ink">
                Shop
              </Link>
              {"  /  "}
              {product.category}
              {"  /  "}
              {product.name}
            </p>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <div
                className="h-[280px] rounded-card bg-linear-to-br from-blush via-[#e7c7bb] to-sage bg-cover bg-center sm:h-[360px] md:h-[420px]"
                style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}
              />

              <div>
                <Eyebrow>
                  {NATURE_LABEL[product.nature]} &middot; {product.category}
                </Eyebrow>
                <h1 className="mb-1.5 font-display text-3xl text-ink sm:text-4xl">{product.name}</h1>
                {signedIn && <PriceTag amount={product.price} className="text-xl" />}
                <p className="my-4 text-text-muted">{product.description}</p>

                <div className="my-4.5 flex flex-wrap gap-2.5">
                  {signedIn && product.availability === "sold_out" && <Badge variant="dang">Sold out</Badge>}
                  {signedIn && product.availability === "made_to_order" && <Badge variant="warn">Made to order</Badge>}
                  {signedIn && product.availability === "available" && <Badge variant="ok">Available</Badge>}
                  {product.nature === "everlasting" && (
                    <Badge variant="muted">{product.leadTimeDays}-day lead time</Badge>
                  )}
                  {product.isCustomizable && <Badge variant="ok">Customisable</Badge>}
                </div>

                {signedIn ? (
                  <div className="my-5 flex flex-wrap items-center gap-3.5">
                    <QtyStepper value={qty} onChange={setQty} min={1} />
                    <Button onClick={handleAddToCart} disabled={product.availability === "sold_out"}>
                      {product.availability === "sold_out" ? "Sold out" : "Add to cart"}
                    </Button>
                    {justAdded && (
                      <span className="text-sm font-semibold text-leaf" role="status">
                        Added to cart &#10003;
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="my-5 rounded-card bg-surface-2 px-4 py-3.5">
                    <p className="mb-2.5 text-sm text-text-muted">Sign in to see price and order this bouquet.</p>
                    <div className="flex flex-wrap gap-3">
                      <Button href="/account/login">Sign in</Button>
                      <Button href="/account/register" variant="ghost">
                        Create an account
                      </Button>
                    </div>
                  </div>
                )}

                {product.isCustomizable && (
                  <div className="rounded-card bg-surface-2 px-4 py-3 text-sm text-text-muted">
                    Want a different colour or size?
                    <Link
                      href={`/custom?from=${product.slug}`}
                      className="ml-1 font-semibold text-rosewood hover:underline"
                    >
                      Request a custom version &rarr;
                    </Link>
                  </div>
                )}

                <Card className="mt-5.5">
                  <CardTitle>Care</CardTitle>
                  <p className="text-sm text-text-muted">
                    {product.nature === "everlasting"
                      ? "Keep away from direct sunlight and moisture. Dust gently with a soft brush. No water needed."
                      : "Trim stems and change the water every two days. Keep away from direct heat for the longest life."}
                  </p>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

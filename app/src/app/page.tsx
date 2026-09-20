"use client";

import * as client from "@/lib/api/client";
import { useAsync, isApiError } from "@/lib/useAsync";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Eyebrow, ErrorBanner } from "@/components/ui/Misc";
import { ProductCard } from "@/components/catalogue/ProductCard";

export default function HomePage() {
  const { data, error, loading } = useAsync(
    () => client.getProducts({ page: 1, pageSize: 4 }),
    []
  );

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="grid grid-cols-1 items-center gap-10 px-6 py-14 sm:px-11 md:grid-cols-2 md:py-20">
          <div>
            <Eyebrow>Handmade in ribbon &amp; bloom</Eyebrow>
            <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
              Flowers that keep their promise.
            </h1>
            <p className="mt-4 max-w-md text-text-muted">
              Fleur&eacute;a hand-winds satin-ribbon and pipe-cleaner blooms that never wilt, and
              arranges fresh seasonal stems picked the morning they&rsquo;re gifted. Browse the
              atelier, build a bouquet, and order in one step.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/shop">Shop the atelier</Button>
              <Button href="/custom" variant="ghost">
                Request a custom bouquet
              </Button>
            </div>
          </div>
          <div
            className="h-64 rounded-card bg-linear-to-br from-blush via-[#e7c7bb] to-sage bg-cover bg-center sm:h-80 md:h-96"
            style={{ backgroundImage: "url(/images/home-hero.avif)" }}
          />
        </section>

        {/* Two natures */}
        <section className="grid grid-cols-1 gap-6 border-y border-border bg-surface-2 px-6 py-14 sm:px-11 md:grid-cols-2">
          <div className="rounded-card border border-border bg-surface p-6">
            <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-ink">
              Everlasting
            </span>
            <h3 className="mt-3 font-display text-xl text-ink">Ribbon &amp; pipe-cleaner blooms</h3>
            <p className="mt-2 text-sm text-text-muted">
              Each petal hand-wound from satin ribbon and floral wire, set on stems that hold their
              shape for years. Made to order &mdash; a short lead time, then yours for good.
            </p>
          </div>
          <div className="rounded-card border border-border bg-surface p-6">
            <span className="inline-block rounded-full bg-leaf-soft px-3 py-1 text-xs font-semibold text-leaf">
              Fresh, on purpose
            </span>
            <h3 className="mt-3 font-display text-xl text-ink">Same-day fresh arrangements</h3>
            <p className="mt-2 text-sm text-text-muted">
              Seasonal stems sourced each morning and arranged by hand, delivered the same day
              they&rsquo;re cut &mdash; optionally paired with a small gift.
            </p>
          </div>
        </section>

        {/* Featured products */}
        <section className="px-6 py-16 sm:px-11">
          <Eyebrow>What we make</Eyebrow>
          <h2 className="mb-6 font-display text-3xl text-ink">From single stem to full bouquet.</h2>

          {loading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[280px] animate-pulse rounded-card bg-surface-2" />
              ))}
            </div>
          )}

          {!loading && error && (
            <ErrorBanner
              message={
                isApiError(error)
                  ? error.message
                  : "We couldn't load products right now. Please try again shortly."
              }
            />
          )}

          {!loading && data && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

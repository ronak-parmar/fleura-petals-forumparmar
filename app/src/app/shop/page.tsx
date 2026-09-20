"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as client from "@/lib/api/client";
import { useAsync, isApiError } from "@/lib/useAsync";
import type { ProductNature } from "@/lib/api/types";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProductCard } from "@/components/catalogue/ProductCard";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Eyebrow, EmptyState, ErrorBanner } from "@/components/ui/Misc";

const PAGE_SIZE = 12;

export default function ShopPage() {
  return (
    <>
      <SiteHeader />
      <Suspense
        fallback={
          <main className="flex-1 px-6 py-14 sm:px-11">
            <p className="text-text-muted">Loading&hellip;</p>
          </main>
        }
      >
        <ShopContent />
      </Suspense>
      <SiteFooter />
    </>
  );
}

function ShopContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categorySlug = searchParams.get("category") ?? "";
  const rawNature = searchParams.get("nature") ?? "";
  const nature: ProductNature | "" =
    rawNature === "everlasting" || rawNature === "fresh" ? rawNature : "";
  const search = searchParams.get("search") ?? "";
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);

  const [searchInput, setSearchInput] = useState(search);
  // Tracks the URL's search value so we can tell "the URL changed under us"
  // (deep link, browser back/forward, "Clear filters") apart from "the user
  // is typing" — adjusted during render per React's guidance, not in an effect.
  const [lastUrlSearch, setLastUrlSearch] = useState(search);
  if (search !== lastUrlSearch) {
    setLastUrlSearch(search);
    setSearchInput(search);
  }

  // Debounce: push the search term to the URL 300ms after typing stops.
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput || undefined, page: undefined });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function updateParams(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function clearFilters() {
    router.push(pathname);
  }

  const { data: categories } = useAsync(() => client.getCategories(), []);
  const { data, error, loading } = useAsync(
    () =>
      client.getProducts({
        category: categorySlug || undefined,
        nature: nature || undefined,
        search: search || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    [categorySlug, nature, search, page]
  );

  const totalPages = data ? Math.max(Math.ceil(data.totalCount / PAGE_SIZE), 1) : 1;
  const hasFilters = Boolean(categorySlug || nature || search);

  return (
    <main className="flex-1 px-6 py-12 sm:px-11">
      <Eyebrow>The atelier</Eyebrow>
      <h1 className="font-display text-3xl text-ink sm:text-4xl">Shop all bouquets &amp; gifts</h1>
      <p className="mt-2 max-w-xl text-text-muted">
        Hand-wound ribbon blooms that last for years, and fresh arrangements made the morning
        they&rsquo;re delivered.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-2.5">
        <Chip active={!categorySlug} onClick={() => updateParams({ category: undefined, page: undefined })}>
          All categories
        </Chip>
        {categories?.map((c) => (
          <Chip
            key={c.id}
            active={categorySlug === c.slug}
            onClick={() => updateParams({ category: c.slug, page: undefined })}
          >
            {c.name}
          </Chip>
        ))}
        <span className="mx-1 hidden h-5.5 w-px bg-border-strong sm:inline-block" aria-hidden="true" />
        <Chip
          active={nature === "everlasting"}
          onClick={() =>
            updateParams({ nature: nature === "everlasting" ? undefined : "everlasting", page: undefined })
          }
        >
          Everlasting
        </Chip>
        <Chip
          active={nature === "fresh"}
          onClick={() => updateParams({ nature: nature === "fresh" ? undefined : "fresh", page: undefined })}
        >
          Fresh
        </Chip>
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search bouquets&hellip;"
          aria-label="Search bouquets"
          className="ml-auto w-full max-w-[240px] rounded-full border border-border-strong bg-surface px-4 py-1.5 text-sm text-ink placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-rosewood/40"
        />
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-rosewood hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-8">
        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[280px] animate-pulse rounded-card bg-surface-2" />
            ))}
          </div>
        )}

        {!loading && error && (
          <ErrorBanner
            message={isApiError(error) ? error.message : "We couldn't load products right now."}
          />
        )}

        {!loading && data && data.items.length === 0 && (
          <EmptyState
            title={search ? "No bouquets match that search" : "No products found"}
            body={
              search
                ? `Nothing matched “${search}”. Try a different word, or clear filters.`
                : "Try a different category or clear filters."
            }
            action={
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        )}

        {!loading && data && data.items.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {!loading && data && totalPages > 1 && (
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Chip key={i} active={page === i + 1} onClick={() => updateParams({ page: String(i + 1) })}>
              {i + 1}
            </Chip>
          ))}
          {page < totalPages && (
            <Chip onClick={() => updateParams({ page: String(page + 1) })}>Next &rarr;</Chip>
          )}
        </div>
      )}
    </main>
  );
}

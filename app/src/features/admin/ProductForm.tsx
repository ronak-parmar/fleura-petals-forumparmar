"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import * as client from "@/lib/api/client";
import { useAsync, isApiError } from "@/lib/useAsync";
import { getAdminToken } from "@/features/admin/session";
import type { Category, Product, ProductAvailability, ProductNature } from "@/lib/api/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, FieldRow, Input, Textarea, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Misc";

/** Shared create/edit form for /admin/products/new and /admin/products/{id}. */
export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const token = getAdminToken();
  const isEdit = !!product;

  // Used to catch a duplicate slug client-side (P14-I4 / P14-A6) — the mock
  // adminUpsertProduct doesn't 409 on this itself, so the form guards it.
  const { data: existingProducts } = useAsync(() => client.adminListProducts(token), [token]);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState<number | "">(product?.categoryId ?? categories[0]?.id ?? "");
  const [nature, setNature] = useState<ProductNature>(product?.nature ?? "everlasting");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [leadTimeDays, setLeadTimeDays] = useState(product ? String(product.leadTimeDays) : "1");
  const [isCustomizable, setIsCustomizable] = useState(product?.isCustomizable ?? false);
  const [availability, setAvailability] = useState<ProductAvailability>(product?.availability ?? "available");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required.";
    if (!slug.trim()) errs.slug = "Slug is required.";
    else if (existingProducts?.some((p) => p.slug === slug.trim() && p.id !== product?.id)) {
      errs.slug = "This slug is already in use.";
    }
    if (!categoryId) errs.categoryId = "Category is required.";
    if (price.trim() === "" || Number.isNaN(Number(price))) {
      errs.price = "Price is required.";
    } else if (Number(price) < 0) {
      errs.price = "Price cannot be negative.";
    }
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await client.adminUpsertProduct(token, {
        id: product?.id,
        name: name.trim(),
        slug: slug.trim(),
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        categoryId: Number(categoryId),
        category: categories.find((c) => c.id === Number(categoryId))?.name ?? "",
        nature,
        price: Number(price),
        leadTimeDays: Math.max(Number(leadTimeDays) || 1, 1),
        isCustomizable,
        availability,
        isActive,
        imageUrl: imageUrl.trim(),
      });
      router.push("/admin/products");
    } catch (err) {
      if (isApiError(err)) {
        setFieldErrors((prev) => ({ ...prev, ...(err.fieldErrors ?? {}) }));
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl italic text-ink">{isEdit ? "Edit product" : "New product"}</h1>
        <div className="flex gap-2.5">
          <Button variant="ghost" size="sm" href="/admin/products">
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving…" : "Save product"}
          </Button>
        </div>
      </div>

      {formError && (
        <div className="mb-5">
          <ErrorBanner message={formError} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4.5">
          <Card>
            <CardTitle>Details</CardTitle>
            <Field label="Name" error={fieldErrors.name} htmlFor="product-name">
              <Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} error={!!fieldErrors.name} />
            </Field>
            <Field label="Slug" error={fieldErrors.slug} htmlFor="product-slug">
              <Input id="product-slug" value={slug} onChange={(e) => setSlug(e.target.value)} error={!!fieldErrors.slug} />
            </Field>
            <Field label="Short description" htmlFor="product-short-desc">
              <Input id="product-short-desc" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
            </Field>
            <Field label="Full description" htmlFor="product-desc" className="mb-0">
              <Textarea id="product-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          </Card>

          <Card>
            <CardTitle>Pricing &amp; type</CardTitle>
            <FieldRow>
              <Field label="Category" error={fieldErrors.categoryId} htmlFor="product-category">
                <Select
                  id="product-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  error={!!fieldErrors.categoryId}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Nature" htmlFor="product-nature">
                <Select id="product-nature" value={nature} onChange={(e) => setNature(e.target.value as ProductNature)}>
                  <option value="everlasting">Everlasting</option>
                  <option value="fresh">Fresh</option>
                </Select>
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Price (₹)" error={fieldErrors.price} htmlFor="product-price">
                <Input
                  id="product-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  error={!!fieldErrors.price}
                />
              </Field>
              <Field label="Lead time (days)" htmlFor="product-lead-time">
                <Input
                  id="product-lead-time"
                  type="number"
                  min="1"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                />
              </Field>
            </FieldRow>
          </Card>
        </div>

        <div className="flex flex-col gap-4.5">
          <Card>
            <CardTitle>Image</CardTitle>
            <div
              className="h-[150px] rounded-lg bg-linear-to-br from-blush via-[#e7c7bb] to-sage"
              style={imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            />
            <Field label="Image URL" htmlFor="product-image-url" className="mt-3">
              <Input
                id="product-image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/images/products/example.svg"
              />
            </Field>
            <p className="mt-1 text-xs text-text-muted">
              File upload isn&apos;t wired up in this project — paste a path or URL directly, or leave it
              blank to fall back to the placeholder gradient.
            </p>
          </Card>

          <Card>
            <CardTitle>Status</CardTitle>
            <Field label="Availability" htmlFor="product-availability">
              <Select id="product-availability" value={availability} onChange={(e) => setAvailability(e.target.value as ProductAvailability)}>
                <option value="available">Available</option>
                <option value="made_to_order">Made to order</option>
                <option value="sold_out">Sold out</option>
              </Select>
            </Field>
            <label className="mt-2 flex items-center justify-between text-sm text-ink">
              <span>Customisable</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-rosewood"
                checked={isCustomizable}
                onChange={(e) => setIsCustomizable(e.target.checked)}
              />
            </label>
            <label className="mt-2.5 flex items-center justify-between text-sm text-ink">
              <span>Visible in shop</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-rosewood"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            </label>
          </Card>
        </div>
      </div>
    </form>
  );
}

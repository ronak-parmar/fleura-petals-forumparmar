"use client";

import { use } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { useAsync, isApiError } from "@/lib/useAsync";
import * as client from "@/lib/api/client";
import { getAdminToken } from "@/features/admin/session";
import { ProductForm } from "@/features/admin/ProductForm";
import { ErrorBanner, EmptyState } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminShell>
      <EditProductContent id={id} />
    </AdminShell>
  );
}

function EditProductContent({ id }: { id: string }) {
  const token = getAdminToken();
  const productId = Number(id);

  const productsAsync = useAsync(() => client.adminListProducts(token), [token]);
  const categoriesAsync = useAsync(() => client.getCategories(), []);

  const loading = productsAsync.loading || categoriesAsync.loading;
  const error = productsAsync.error ?? categoriesAsync.error;

  if (loading) return null;

  if (error || !productsAsync.data || !categoriesAsync.data) {
    return <ErrorBanner message={isApiError(error) ? error.message : "Couldn't load the product."} />;
  }

  const product = productsAsync.data.find((p) => p.id === productId);

  // P14-L4 — unknown product id -> "product not found".
  if (!product) {
    return (
      <EmptyState
        title="Product not found"
        body="This product may have been removed."
        action={<Button href="/admin/products" size="sm">Back to products</Button>}
      />
    );
  }

  return <ProductForm product={product} categories={categoriesAsync.data} />;
}

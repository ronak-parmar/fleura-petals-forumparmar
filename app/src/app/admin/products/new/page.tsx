"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { useAsync, isApiError } from "@/lib/useAsync";
import * as client from "@/lib/api/client";
import { ProductForm } from "@/features/admin/ProductForm";
import { ErrorBanner } from "@/components/ui/Misc";

export default function NewProductPage() {
  return (
    <AdminShell>
      <NewProductContent />
    </AdminShell>
  );
}

function NewProductContent() {
  const { data: categories, error, loading } = useAsync(() => client.getCategories(), []);

  if (loading) return null;
  if (error || !categories) {
    return <ErrorBanner message={isApiError(error) ? error.message : "Couldn't load categories."} />;
  }

  return <ProductForm categories={categories} />;
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/AdminShell";
import { useAsync, isApiError } from "@/lib/useAsync";
import * as client from "@/lib/api/client";
import { getAdminToken } from "@/features/admin/session";
import { TableWrap, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ErrorBanner, EmptyState, PriceTag } from "@/components/ui/Misc";
import type { Product, ProductAvailability } from "@/lib/api/types";

const NATURE_LABEL: Record<Product["nature"], string> = {
  everlasting: "Everlasting",
  fresh: "Fresh",
};

export default function AdminProductsPage() {
  return (
    <AdminShell>
      <ProductsContent />
    </AdminShell>
  );
}

function ProductsContent() {
  const token = getAdminToken();
  const { data: products, error, loading, reload } = useAsync(() => client.adminListProducts(token), [token]);
  const [toggleError, setToggleError] = useState<string>("");

  async function handleAvailabilityChange(id: number, next: ProductAvailability) {
    setToggleError("");
    try {
      await client.adminSetProductAvailability(token, id, next);
      reload();
    } catch (e) {
      setToggleError(isApiError(e) ? e.message : "Couldn't update availability.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl italic text-ink">Products</h1>
          {products && <span className="text-[13px] text-text-muted">{products.length} products</span>}
        </div>
        <Button href="/admin/products/new" size="sm">New product</Button>
      </div>

      {error && <div className="mb-5"><ErrorBanner message={isApiError(error) ? error.message : "Couldn't load products."} /></div>}
      {toggleError && <div className="mb-5"><ErrorBanner message={toggleError} /></div>}

      {!loading && !error && products && products.length === 0 && (
        <EmptyState title="No products yet" body="Create your first product to get the shop started." action={<Button href="/admin/products/new" size="sm">New product</Button>} />
      )}

      {products && products.length > 0 && (
        <TableWrap>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>Nature</Th>
              <Th>Price</Th>
              <Th>Availability</Th>
              <Th>Quick toggle</Th>
              <Th />
            </Tr>
          </Thead>
          <tbody>
            {products.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <Link href={`/admin/products/${p.id}`} className="font-semibold text-ink hover:text-rosewood">
                    {p.name}
                  </Link>
                  {!p.isActive && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-text-muted">Hidden</span>}
                </Td>
                <Td>{p.category}</Td>
                <Td>{NATURE_LABEL[p.nature]}</Td>
                <Td><PriceTag amount={p.price} /></Td>
                <Td><StatusBadge status={p.availability} /></Td>
                <Td>
                  <Select
                    value={p.availability}
                    onChange={(e) => handleAvailabilityChange(p.id, e.target.value as ProductAvailability)}
                    className="w-auto px-2.5 py-1.5 text-xs"
                  >
                    <option value="available">Available</option>
                    <option value="made_to_order">Made to order</option>
                    <option value="sold_out">Sold out</option>
                  </Select>
                </Td>
                <Td>
                  <Link href={`/admin/products/${p.id}`} className="text-xs font-semibold text-rosewood hover:underline">
                    Edit
                  </Link>
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}

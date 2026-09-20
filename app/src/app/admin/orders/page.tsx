"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { TableWrap, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Chip } from "@/components/ui/Chip";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState, ErrorBanner, PriceTag } from "@/components/ui/Misc";
import { useAsync, isApiError } from "@/lib/useAsync";
import * as client from "@/lib/api/client";
import { getAdminToken } from "@/features/admin/session";
import type { OrderStatus } from "@/lib/api/types";

const STATUS_FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_preparation", label: "In preparation" },
  { value: "ready", label: "Ready" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function formatPlaced(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(iso));
}
function formatDeliverBy(dateStr: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(
    new Date(dateStr + "T00:00:00")
  );
}
function slotLabel(slot: string) {
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <AdminOrdersPageContent />
    </Suspense>
  );
}

function AdminOrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status");
  const status = (STATUS_FILTERS.some((f) => f.value === rawStatus) ? rawStatus : "all") as OrderStatus | "all";

  const { data: orders, error, loading } = useAsync(
    () => client.adminListOrders(getAdminToken(), status === "all" ? undefined : status),
    [status]
  );

  const sortedOrders = orders ? [...orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt)) : null;

  function selectStatus(value: OrderStatus | "all") {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("status");
    else params.set("status", value);
    const qs = params.toString();
    router.push(`/admin/orders${qs ? `?${qs}` : ""}`);
  }

  return (
    <AdminShell>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl italic text-ink">Orders</h1>
        {sortedOrders && (
          <span className="text-sm text-text-muted">
            {sortedOrders.length} order{sortedOrders.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mb-4.5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Chip key={f.value} active={status === f.value} onClick={() => selectStatus(f.value)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {loading && <p className="text-sm text-text-muted">Loading…</p>}
      {error && <ErrorBanner message={isApiError(error) ? error.message : "Something went wrong."} />}

      {sortedOrders && sortedOrders.length === 0 && (
        <EmptyState title="No orders with this status" body="Try a different filter." />
      )}

      {sortedOrders && sortedOrders.length > 0 && (
        <>
          <TableWrap>
            <Thead>
              <tr>
                <Th>Order</Th>
                <Th>Recipient</Th>
                <Th>Placed</Th>
                <Th>Deliver by</Th>
                <Th>Slot</Th>
                <Th>Items</Th>
                <Th>Total</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <tbody>
              {sortedOrders.map((o) => (
                <Tr
                  key={o.id}
                  onClick={() => router.push(`/admin/orders/${o.id}`)}
                  className="cursor-pointer hover:bg-surface-2"
                >
                  <Td className="font-mono">{o.orderNumber}</Td>
                  <Td>{o.recipientName}</Td>
                  <Td>{formatPlaced(o.placedAt)}</Td>
                  <Td>{formatDeliverBy(o.deliveryDate)}</Td>
                  <Td>{slotLabel(o.deliverySlot)}</Td>
                  <Td>{o.items.length}</Td>
                  <Td>
                    <PriceTag amount={o.total} />
                  </Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
          <p className="mt-3 text-xs text-text-muted">Click a row to open the order and update its status.</p>
        </>
      )}
    </AdminShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardTitle } from "@/components/ui/Card";
import { TableWrap, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { EmptyState, ErrorBanner, PriceTag } from "@/components/ui/Misc";
import { useAsync, isApiError } from "@/lib/useAsync";
import * as client from "@/lib/api/client";
import { getAdminToken } from "@/features/admin/session";
import type { OrderStatus } from "@/lib/api/types";

// The order pipeline is a strict forward-only sequence; "cancelled" is a side
// branch only reachable from the two earliest stages. Kept local to this page
// per FOUNDATION.md (client.ts's own copy of this flow is not exported).
const ORDER_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "in_preparation",
  "ready",
  "out_for_delivery",
  "delivered",
];

function nextOrderStatus(current: OrderStatus): OrderStatus | null {
  const idx = ORDER_FLOW.indexOf(current);
  if (idx === -1 || idx === ORDER_FLOW.length - 1) return null;
  return ORDER_FLOW[idx + 1];
}
function canCancel(current: OrderStatus) {
  return current === "pending" || current === "confirmed";
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}
function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
function slotDetail(slot: string) {
  const map: Record<string, string> = {
    morning: "Morning (9am–12pm)",
    afternoon: "Afternoon (12pm–4pm)",
    evening: "Evening (4pm–8pm)",
  };
  return map[slot] ?? slot;
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: order, error, loading, reload } = useAsync(
    () => client.adminGetOrder(getAdminToken(), id),
    [id]
  );

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setSelectedStatus(nextOrderStatus(order.status) ?? "");
      setActionError(null);
    }
  }, [order]);

  async function handleAdvance() {
    if (!order || !selectedStatus) return;
    setSaving(true);
    setActionError(null);
    try {
      await client.adminUpdateOrderStatus(getAdminToken(), order.id, selectedStatus as OrderStatus);
      reload();
    } catch (e) {
      setActionError(isApiError(e) ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!order) return;
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    setSaving(true);
    setActionError(null);
    try {
      await client.adminUpdateOrderStatus(getAdminToken(), order.id, "cancelled");
      reload();
    } catch (e) {
      setActionError(isApiError(e) ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      {loading && <p className="text-sm text-text-muted">Loading…</p>}

      {error && isApiError(error) && error.status === 404 && (
        <EmptyState
          title="Order not found"
          body="This order doesn't exist or may have been removed."
          action={<Button href="/admin/orders">Back to orders</Button>}
        />
      )}
      {error && !(isApiError(error) && error.status === 404) && (
        <ErrorBanner message={isApiError(error) ? error.message : "Something went wrong."} />
      )}

      {order && (
        <>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-text-muted">Orders / {order.orderNumber}</p>
              <h1 className="font-display text-2xl italic text-ink">Order {order.orderNumber}</h1>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-4.5">
              <Card>
                <CardTitle>Items</CardTitle>
                <TableWrap>
                  <Thead>
                    <tr>
                      <Th>Product</Th>
                      <Th>Unit price</Th>
                      <Th>Qty</Th>
                      <Th>Line total</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {order.items.map((item) => (
                      <Tr key={item.productId}>
                        <Td>{item.productName}</Td>
                        <Td>
                          <PriceTag amount={item.unitPrice} />
                        </Td>
                        <Td>{item.quantity}</Td>
                        <Td>
                          <PriceTag amount={item.lineTotal} />
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </TableWrap>
                <div className="mt-3 flex flex-col gap-1 text-sm">
                  <div className="flex justify-between text-text-muted">
                    <span>Subtotal</span>
                    <PriceTag amount={order.subtotal} />
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Delivery fee</span>
                    <span>{order.deliveryFee === 0 ? "Free" : <PriceTag amount={order.deliveryFee} />}</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-border pt-2 font-bold text-ink">
                    <span>Total (pay on delivery)</span>
                    <PriceTag amount={order.total} />
                  </div>
                </div>
              </Card>

              <Card>
                <CardTitle>Delivery &amp; contact</CardTitle>
                <p className="text-sm leading-relaxed text-text-muted">
                  {order.recipientName} · {order.recipientPhone}
                  <br />
                  {order.addressLine1}
                  {order.addressLine2 && `, ${order.addressLine2}`}, {order.city}
                  {order.state && `, ${order.state}`} {order.postalCode}
                  {order.landmark && (
                    <>
                      <br />
                      Landmark: {order.landmark}
                    </>
                  )}
                  <br />
                  Deliver {formatDate(order.deliveryDate)} · {slotDetail(order.deliverySlot)}
                  {order.giftMessage && (
                    <>
                      <br />
                      <br />
                      <b className="text-ink">Gift message:</b> &ldquo;{order.giftMessage}&rdquo;
                    </>
                  )}
                  {order.customerNote && (
                    <>
                      <br />
                      <br />
                      <b className="text-ink">Customer note:</b> {order.customerNote}
                    </>
                  )}
                </p>
              </Card>
            </div>

            <div>
              <Card>
                <CardTitle>Update status</CardTitle>

                {actionError && (
                  <div className="mb-3.5">
                    <ErrorBanner message={actionError} />
                  </div>
                )}

                {selectedStatus ? (
                  <>
                    <Field label="Move to">
                      <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}>
                        <option value={selectedStatus}>
                          {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1).replace(/_/g, " ")}
                        </option>
                      </Select>
                    </Field>
                    <Button block onClick={handleAdvance} disabled={saving}>
                      {saving ? "Updating…" : "Update status"}
                    </Button>
                  </>
                ) : (
                  <p className="mb-3.5 text-sm text-text-muted">No further transitions are available for this order.</p>
                )}

                {canCancel(order.status) && (
                  <Button variant="ghost" block className="mt-2.5" onClick={handleCancel} disabled={saving}>
                    Cancel this order
                  </Button>
                )}

                <hr className="my-4 border-border" />
                <p className="text-xs text-text-muted">Placed {formatDateTime(order.placedAt)}</p>
              </Card>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}

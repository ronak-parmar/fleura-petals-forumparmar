"use client";

import Link from "next/link";
import { AdminShell } from "@/components/layout/AdminShell";
import { useAsync, isApiError } from "@/lib/useAsync";
import * as client from "@/lib/api/client";
import { getAdminToken } from "@/features/admin/session";
import { Card, CardTitle } from "@/components/ui/Card";
import { TableWrap, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { ErrorBanner, EmptyState } from "@/components/ui/Misc";
import type { Order, CustomRequest } from "@/lib/api/types";

const EARLY_STAGE: Order["status"][] = ["pending", "confirmed", "in_preparation", "ready", "out_for_delivery"];

function formatShortDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const weekday = d.toLocaleDateString("en-GB", { weekday: "short" });
  const month = d.toLocaleDateString("en-GB", { month: "short" });
  return `${weekday} ${d.getDate()} ${month}`;
}

function formatBudget(n: number) {
  return n >= 1000 ? `${parseFloat((n / 1000).toFixed(1))}k` : String(n);
}

function formatTodayLong() {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
}

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <DashboardContent />
    </AdminShell>
  );
}

function DashboardContent() {
  const token = getAdminToken();

  const summary = useAsync(() => client.adminDashboardSummary(token), [token]);
  const ordersAsync = useAsync(() => client.adminListOrders(token), [token]);
  const requestsAsync = useAsync(() => client.adminListCustomRequests(token, "new"), [token]);

  const needingAttention: Order[] = (ordersAsync.data ?? [])
    .filter((o) => EARLY_STAGE.includes(o.status))
    .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))
    .slice(0, 6);

  const newRequests: CustomRequest[] = (requestsAsync.data ?? []).slice(0, 6);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl italic text-ink">Dashboard</h1>
        <span className="text-[13px] text-text-muted">{formatTodayLong()}</span>
      </div>

      {summary.error && <div className="mb-5"><ErrorBanner message={isApiError(summary.error) ? summary.error.message : "Couldn't load the dashboard."} /></div>}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Orders pending" value={summary.data?.ordersPending} loading={summary.loading} />
        <StatCard label="Orders in progress" value={summary.data?.ordersInProgress} loading={summary.loading} />
        <StatCard label="New custom requests" value={summary.data?.customRequestsNew} loading={summary.loading} />
        <StatCard label="Unhandled enquiries" value={summary.data?.enquiriesUnhandled} loading={summary.loading} />
      </div>

      <div className="flex flex-col gap-5">
        <Card>
          <CardTitle>Orders needing attention</CardTitle>
          {ordersAsync.error && <ErrorBanner message={isApiError(ordersAsync.error) ? ordersAsync.error.message : "Couldn't load orders."} />}
          {!ordersAsync.error && !ordersAsync.loading && needingAttention.length === 0 && (
            <EmptyState title="Nothing needs attention" body="No pending or in-progress orders right now." />
          )}
          {needingAttention.length > 0 && (
            <TableWrap>
              <Thead>
                <Tr>
                  <Th>Order</Th>
                  <Th>Recipient</Th>
                  <Th>Deliver by</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <tbody>
                {needingAttention.map((o) => (
                  <Tr key={o.id}>
                    <Td>
                      <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs text-rosewood hover:underline">
                        {o.orderNumber}
                      </Link>
                    </Td>
                    <Td>{o.recipientName}</Td>
                    <Td>{formatShortDate(o.deliveryDate)}</Td>
                    <Td><StatusBadge status={o.status} /></Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>

        <Card>
          <CardTitle>New custom requests</CardTitle>
          {requestsAsync.error && <ErrorBanner message={isApiError(requestsAsync.error) ? requestsAsync.error.message : "Couldn't load custom requests."} />}
          {!requestsAsync.error && !requestsAsync.loading && newRequests.length === 0 && (
            <EmptyState title="No new requests" body="New custom bouquet requests will show up here." />
          )}
          {newRequests.length > 0 && (
            <TableWrap>
              <Thead>
                <Tr>
                  <Th>Request</Th>
                  <Th>Occasion</Th>
                  <Th>Need by</Th>
                  <Th>Budget</Th>
                </Tr>
              </Thead>
              <tbody>
                {newRequests.map((r) => (
                  <Tr key={r.id}>
                    <Td>
                      <Link href={`/admin/custom-requests/${r.id}`} className="font-mono text-xs text-rosewood hover:underline">
                        {r.requestNumber}
                      </Link>
                    </Td>
                    <Td>{r.occasion}</Td>
                    <Td>{formatShortDate(r.needByDate)}</Td>
                    <Td>₹{formatBudget(r.budgetMin)}–{formatBudget(r.budgetMax)}</Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, loading }: { label: string; value: number | undefined; loading: boolean }) {
  return (
    <div className="rounded-card border border-border bg-surface px-4.5 py-4.5 text-center">
      <b className="block font-display text-[1.9rem] leading-none text-rosewood">{loading ? "–" : (value ?? 0)}</b>
      <span className="mt-1.5 block text-xs text-text-muted">{label}</span>
    </div>
  );
}

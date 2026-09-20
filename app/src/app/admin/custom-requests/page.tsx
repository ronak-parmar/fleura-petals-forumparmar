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
import type { CustomRequestStatus } from "@/lib/api/types";

const STATUS_FILTERS: { value: CustomRequestStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "quoted", label: "Quoted" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "converted_to_order", label: "Converted to order" },
  { value: "closed", label: "Closed" },
];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(iso));
}

export default function AdminCustomRequestsPage() {
  return (
    <Suspense fallback={null}>
      <AdminCustomRequestsPageContent />
    </Suspense>
  );
}

function AdminCustomRequestsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status");
  const status = (STATUS_FILTERS.some((f) => f.value === rawStatus) ? rawStatus : "all") as
    | CustomRequestStatus
    | "all";

  const { data: requests, error, loading } = useAsync(
    () => client.adminListCustomRequests(getAdminToken(), status === "all" ? undefined : status),
    [status]
  );

  const sortedRequests = requests ? [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : null;

  function selectStatus(value: CustomRequestStatus | "all") {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("status");
    else params.set("status", value);
    const qs = params.toString();
    router.push(`/admin/custom-requests${qs ? `?${qs}` : ""}`);
  }

  return (
    <AdminShell>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl italic text-ink">Custom requests</h1>
        {sortedRequests && (
          <span className="text-sm text-text-muted">
            {sortedRequests.length} request{sortedRequests.length === 1 ? "" : "s"}
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

      {sortedRequests && sortedRequests.length === 0 && (
        <EmptyState title="No requests with this status" body="Try a different filter." />
      )}

      {sortedRequests && sortedRequests.length > 0 && (
        <>
          <TableWrap>
            <Thead>
              <tr>
                <Th>Request</Th>
                <Th>Contact</Th>
                <Th>Occasion</Th>
                <Th>Need by</Th>
                <Th>Budget</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <tbody>
              {sortedRequests.map((r) => (
                <Tr
                  key={r.id}
                  onClick={() => router.push(`/admin/custom-requests/${r.id}`)}
                  className="cursor-pointer hover:bg-surface-2"
                >
                  <Td className="font-mono">{r.requestNumber}</Td>
                  <Td>{r.contactName}</Td>
                  <Td>{r.occasion}</Td>
                  <Td>{formatDate(r.needByDate)}</Td>
                  <Td>
                    <PriceTag amount={r.budgetMin} /> – <PriceTag amount={r.budgetMax} />
                  </Td>
                  <Td>
                    <StatusBadge status={r.status} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
          <p className="mt-3 text-xs text-text-muted">Click a row to open the request and respond.</p>
        </>
      )}
    </AdminShell>
  );
}

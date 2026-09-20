"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { TableWrap, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Chip } from "@/components/ui/Chip";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorBanner } from "@/components/ui/Misc";
import { useAsync, isApiError } from "@/lib/useAsync";
import * as client from "@/lib/api/client";
import { getAdminToken } from "@/features/admin/session";
import type { Enquiry } from "@/lib/api/types";

type Filter = "all" | "unhandled" | "handled";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unhandled", label: "Unhandled" },
  { value: "handled", label: "Handled" },
];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export default function AdminEnquiriesPage() {
  const { data: enquiries, error, loading, reload } = useAsync(
    () => client.adminListEnquiries(getAdminToken()),
    []
  );

  const [filter, setFilter] = useState<Filter>("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const sorted = useMemo(() => {
    if (!enquiries) return null;
    // Unhandled first (P18-L2), newest first within each group.
    return [...enquiries].sort((a, b) => {
      if (a.isHandled !== b.isHandled) return a.isHandled ? 1 : -1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [enquiries]);

  const visible = useMemo(() => {
    if (!sorted) return null;
    if (filter === "all") return sorted;
    return sorted.filter((e) => (filter === "handled" ? e.isHandled : !e.isHandled));
  }, [sorted, filter]);

  async function toggleHandled(enquiry: Enquiry) {
    setActionError(null);
    setPendingId(enquiry.id);
    try {
      await client.adminMarkEnquiryHandled(getAdminToken(), enquiry.id, !enquiry.isHandled);
      reload();
    } catch (err) {
      setActionError(isApiError(err) ? err.message : "Something went wrong.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <AdminShell>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl italic text-ink">Enquiries</h1>
        {sorted && (
          <span className="text-sm text-text-muted">
            {sorted.length} enquir{sorted.length === 1 ? "y" : "ies"}
          </span>
        )}
      </div>

      <div className="mb-4.5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {loading && <p className="text-sm text-text-muted">Loading…</p>}
      {error && <ErrorBanner message={isApiError(error) ? error.message : "Something went wrong."} />}
      {actionError && <ErrorBanner message={actionError} />}

      {visible && visible.length === 0 && (
        <EmptyState title="No enquiries with this filter" body="Try a different filter." />
      )}

      {visible && visible.length > 0 && (
        <TableWrap>
          <Thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Message</Th>
              <Th>Received</Th>
              <Th>Status</Th>
              <Th>&nbsp;</Th>
            </tr>
          </Thead>
          <tbody>
            {visible.map((e) => (
              <Tr key={e.id}>
                <Td>{e.name}</Td>
                <Td>{e.email}</Td>
                <Td className="max-w-xs">{e.message}</Td>
                <Td>{formatDate(e.createdAt)}</Td>
                <Td>
                  <Badge variant={e.isHandled ? "ok" : "warn"}>{e.isHandled ? "Handled" : "Unhandled"}</Badge>
                </Td>
                <Td>
                  <Button size="sm" variant="ghost" onClick={() => toggleHandled(e)} disabled={pendingId === e.id}>
                    {pendingId === e.id ? "…" : e.isHandled ? "Mark unhandled" : "Mark handled"}
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </AdminShell>
  );
}

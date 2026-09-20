"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { Card, CardTitle } from "@/components/ui/Card";
import { TableWrap, Tr, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea, Input } from "@/components/ui/Field";
import { EmptyState, ErrorBanner, PriceTag } from "@/components/ui/Misc";
import { useAsync, isApiError } from "@/lib/useAsync";
import * as client from "@/lib/api/client";
import { getAdminToken } from "@/features/admin/session";
import type { BouquetSize, BouquetType, CustomRequestStatus } from "@/lib/api/types";

const STATUS_OPTIONS: { value: CustomRequestStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "quoted", label: "Quoted" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "converted_to_order", label: "Converted to order" },
  { value: "closed", label: "Closed" },
];

const TYPE_LABEL: Record<BouquetType, string> = {
  ribbon: "All-ribbon (everlasting)",
  fresh: "All-fresh",
  mixed: "Mixed — ribbon & fresh",
};

const SIZE_LABEL: Record<BouquetSize, string> = {
  posy: "Posy",
  standard: "Standard",
  large: "Large",
  event: "Event / installation",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso)
  );
}

interface FormState {
  status: CustomRequestStatus;
  adminResponse: string;
  quotedPrice: string;
}

export default function AdminCustomRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: request, error, loading, reload } = useAsync(
    () => client.adminGetCustomRequest(getAdminToken(), id),
    [id]
  );

  const [form, setForm] = useState<FormState | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (request) {
      setForm({
        status: request.status,
        adminResponse: request.adminResponse ?? "",
        quotedPrice: request.quotedPrice != null ? String(request.quotedPrice) : "",
      });
    }
  }, [request]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form || !request) return;
    setFieldError(null);
    setActionError(null);

    const priceText = form.quotedPrice.trim();
    const parsedPrice = priceText === "" ? undefined : Number(priceText);
    if (form.status === "quoted" && parsedPrice == null && request.quotedPrice == null) {
      setFieldError("A quote needs a price.");
      return;
    }

    setSaving(true);
    try {
      await client.adminRespondCustomRequest(getAdminToken(), request.id, {
        status: form.status,
        adminResponse: form.adminResponse === "" ? undefined : form.adminResponse,
        quotedPrice: parsedPrice,
      });
      reload();
    } catch (err) {
      if (isApiError(err) && err.fieldErrors?.quotedPrice) setFieldError(err.fieldErrors.quotedPrice);
      else setActionError(isApiError(err) ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConvert() {
    if (!request) return;
    if (!window.confirm("Mark this request as converted to order?")) return;
    setConverting(true);
    setActionError(null);
    try {
      await client.adminRespondCustomRequest(getAdminToken(), request.id, { status: "converted_to_order" });
      reload();
    } catch (err) {
      setActionError(isApiError(err) ? err.message : "Something went wrong.");
    } finally {
      setConverting(false);
    }
  }

  return (
    <AdminShell>
      {loading && <p className="text-sm text-text-muted">Loading…</p>}

      {error && isApiError(error) && error.status === 404 && (
        <EmptyState
          title="Request not found"
          body="This custom request doesn't exist or may have been removed."
          action={<Button href="/admin/custom-requests">Back to custom requests</Button>}
        />
      )}
      {error && !(isApiError(error) && error.status === 404) && (
        <ErrorBanner message={isApiError(error) ? error.message : "Something went wrong."} />
      )}

      {request && form && (
        <>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-text-muted">Custom requests / {request.requestNumber}</p>
              <h1 className="font-display text-2xl italic text-ink">Custom request</h1>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-4.5">
              <Card>
                <CardTitle>The brief</CardTitle>
                <TableWrap>
                  <tbody>
                    <Tr>
                      <Td className="w-36 text-text-muted">Type</Td>
                      <Td>{TYPE_LABEL[request.bouquetType]}</Td>
                    </Tr>
                    <Tr>
                      <Td className="text-text-muted">Occasion</Td>
                      <Td>{request.occasion}</Td>
                    </Tr>
                    <Tr>
                      <Td className="text-text-muted">Palette</Td>
                      <Td>{request.palette || "—"}</Td>
                    </Tr>
                    <Tr>
                      <Td className="text-text-muted">Flowers</Td>
                      <Td>{request.flowersPreferred || "—"}</Td>
                    </Tr>
                    <Tr>
                      <Td className="text-text-muted">Size</Td>
                      <Td>{SIZE_LABEL[request.size]}</Td>
                    </Tr>
                    <Tr>
                      <Td className="text-text-muted">Budget</Td>
                      <Td>
                        <PriceTag amount={request.budgetMin} /> – <PriceTag amount={request.budgetMax} />
                      </Td>
                    </Tr>
                    <Tr>
                      <Td className="text-text-muted">Need by</Td>
                      <Td>{formatDate(request.needByDate)}</Td>
                    </Tr>
                    <Tr>
                      <Td className="text-text-muted">Notes</Td>
                      <Td>{request.referenceNotes || "—"}</Td>
                    </Tr>
                    <Tr>
                      <Td className="text-text-muted">Inspiration</Td>
                      <Td>
                        {request.inspirationImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={request.inspirationImageUrl}
                            alt="Inspiration reference"
                            className="max-h-48 rounded-lg border border-border object-cover"
                          />
                        ) : (
                          <span className="text-text-muted">None attached</span>
                        )}
                      </Td>
                    </Tr>
                  </tbody>
                </TableWrap>
              </Card>

              <Card>
                <CardTitle>Contact</CardTitle>
                <p className="text-sm text-text-muted">
                  {request.contactName} · {request.contactPhone} · {request.contactEmail}
                </p>
              </Card>
            </div>

            <div>
              <Card>
                <CardTitle>Respond</CardTitle>

                {actionError && (
                  <div className="mb-3.5">
                    <ErrorBanner message={actionError} />
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <Field label="Status">
                    <Select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as CustomRequestStatus })}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Response to customer">
                    <Textarea
                      rows={4}
                      value={form.adminResponse}
                      onChange={(e) => setForm({ ...form, adminResponse: e.target.value })}
                      placeholder="What you'd like the customer to know…"
                    />
                  </Field>
                  <Field label="Rough quote (₹)" error={fieldError ?? undefined}>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      value={form.quotedPrice}
                      onChange={(e) => setForm({ ...form, quotedPrice: e.target.value })}
                      error={!!fieldError}
                    />
                  </Field>
                  <Button type="submit" block disabled={saving}>
                    {saving ? "Sending…" : "Send response"}
                  </Button>
                </form>

                <Button variant="ghost" block className="mt-2.5" onClick={handleConvert} disabled={converting}>
                  {converting ? "Converting…" : "Convert to order"}
                </Button>
              </Card>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}

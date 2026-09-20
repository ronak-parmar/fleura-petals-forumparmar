"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, FieldRow, Input } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { TableWrap, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Eyebrow, EmptyState, ErrorBanner, PriceTag } from "@/components/ui/Misc";
import { useAsync, isApiError } from "@/lib/useAsync";
import * as client from "@/lib/api/client";
import type { Address } from "@/lib/api/types";
import { getCustomerToken, clearCustomerToken } from "@/features/account/session";

type Tab = "orders" | "requests" | "addresses";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export default function AccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orders");

  // Read synchronously on first render (lazy initializer) rather than via an
  // effect: starting this as `undefined` and setting it later created a window
  // where the useAsync calls below ran once with no token, got a stale
  // "not signed in" rejection, and cleared a session that became valid a
  // render later — bouncing a just-registered / just-logged-in customer
  // straight back to the login page. null = determined absent (redirecting).
  const [token] = useState<string | null>(() => getCustomerToken());

  useEffect(() => {
    if (!token) router.replace("/account/login");
  }, [token, router]);

  const {
    data: customer,
    error: meError,
    loading: meLoading,
  } = useAsync(() => (token ? client.me(token) : Promise.reject(new Error("no-token"))), [token]);

  // P11-L5: an expired / tampered token clears the session and sends the
  // customer back to the login page instead of showing an error.
  useEffect(() => {
    if (token && meError) {
      clearCustomerToken();
      router.replace("/account/login");
    }
  }, [token, meError, router]);

  const {
    data: orders,
    error: ordersError,
    loading: ordersLoading,
  } = useAsync(() => (token ? client.myOrders(token) : Promise.reject(new Error("no-token"))), [token]);

  const {
    data: requests,
    error: requestsError,
    loading: requestsLoading,
  } = useAsync(() => (token ? client.myCustomRequests(token) : Promise.reject(new Error("no-token"))), [token]);

  const {
    data: addresses,
    error: addressesError,
    loading: addressesLoading,
    reload: reloadAddresses,
  } = useAsync(() => (token ? client.myAddresses(token) : Promise.reject(new Error("no-token"))), [token]);

  function handleLogout() {
    clearCustomerToken();
    router.push("/");
  }

  if (!token || meLoading || !customer) {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <main className="flex-1 px-6 py-10 sm:px-11">
          <p className="text-sm text-text-muted">Loading your account…</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 px-6 py-10 sm:px-11">
        <Eyebrow>Account</Eyebrow>
        <h1 className="mb-1.5 font-display text-[34px] text-ink">Hello, {customer.name}</h1>
        <p className="mb-5.5 text-text-muted">{customer.email}</p>

        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <Chip active={tab === "orders"} onClick={() => setTab("orders")}>
            My orders
          </Chip>
          <Chip active={tab === "requests"} onClick={() => setTab("requests")}>
            Custom requests
          </Chip>
          <Chip active={tab === "addresses"} onClick={() => setTab("addresses")}>
            Saved addresses
          </Chip>
          <Chip onClick={handleLogout} className="ml-auto">
            Log out
          </Chip>
        </div>

        {tab === "orders" && (
          <section>
            {ordersLoading && <p className="text-sm text-text-muted">Loading orders…</p>}
            {ordersError && (
              <ErrorBanner message={isApiError(ordersError) ? ordersError.message : "Couldn't load your orders."} />
            )}
            {orders && orders.length === 0 && (
              <EmptyState
                title="You haven't placed an order yet"
                body="Browse the atelier to find something worth keeping."
                action={<Button href="/shop">Shop the atelier</Button>}
              />
            )}
            {orders && orders.length > 0 && (
              <TableWrap>
                <Thead>
                  <tr>
                    <Th>Order</Th>
                    <Th>Placed</Th>
                    <Th>Items</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                    <Th></Th>
                  </tr>
                </Thead>
                <tbody>
                  {orders.map((o) => (
                    <Tr key={o.id}>
                      <Td className="font-mono text-xs">{o.orderNumber}</Td>
                      <Td>{formatDate(o.placedAt)}</Td>
                      <Td>{o.items.reduce((n, i) => n + i.quantity, 0)} item(s)</Td>
                      <Td>
                        <PriceTag amount={o.total} />
                      </Td>
                      <Td>
                        <StatusBadge status={o.status} />
                      </Td>
                      <Td>
                        <Link href={`/track?order=${encodeURIComponent(o.orderNumber)}`} className="text-text-muted hover:text-ink">
                          Track
                        </Link>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </section>
        )}

        {tab === "requests" && (
          <section>
            {requestsLoading && <p className="text-sm text-text-muted">Loading custom requests…</p>}
            {requestsError && (
              <ErrorBanner message={isApiError(requestsError) ? requestsError.message : "Couldn't load your requests."} />
            )}
            {requests && requests.length === 0 && (
              <EmptyState
                title="No custom requests yet"
                body="Tell us about the bouquet you have in mind."
                action={<Button href="/custom">Request a custom bouquet</Button>}
              />
            )}
            {requests && requests.length > 0 && (
              <TableWrap>
                <Thead>
                  <tr>
                    <Th>Request</Th>
                    <Th>Submitted</Th>
                    <Th>Occasion</Th>
                    <Th>Status</Th>
                    <Th>Quoted price</Th>
                  </tr>
                </Thead>
                <tbody>
                  {requests.map((r) => (
                    <Tr key={r.id}>
                      <Td className="font-mono text-xs">{r.requestNumber}</Td>
                      <Td>{formatDate(r.createdAt)}</Td>
                      <Td>{r.occasion}</Td>
                      <Td>
                        <StatusBadge status={r.status} />
                      </Td>
                      <Td>{r.quotedPrice != null ? <PriceTag amount={r.quotedPrice} /> : <span className="text-text-muted">—</span>}</Td>
                    </Tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </section>
        )}

        {tab === "addresses" && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div>
              {addressesLoading && <p className="text-sm text-text-muted">Loading addresses…</p>}
              {addressesError && (
                <ErrorBanner message={isApiError(addressesError) ? addressesError.message : "Couldn't load your addresses."} />
              )}
              {addresses && addresses.length === 0 && (
                <EmptyState title="No saved addresses yet" body="Add one so checkout goes faster next time." />
              )}
              {addresses && addresses.length > 0 && (
                <div className="flex flex-col gap-3.5">
                  {addresses.map((a) => (
                    <Card key={a.id}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wide text-gold-ink">{a.label || "Address"}</span>
                      </div>
                      <p className="text-sm font-semibold text-ink">{a.recipientName}</p>
                      {a.phone && <p className="text-sm text-text-muted">{a.phone}</p>}
                      <p className="mt-1.5 text-sm text-text-muted">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}
                        <br />
                        {a.city}
                        {a.state ? `, ${a.state}` : ""} {a.postalCode}
                        {a.landmark && (
                          <>
                            <br />
                            {a.landmark}
                          </>
                        )}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <AddAddressForm token={token} onAdded={reloadAddresses} />
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function AddAddressForm({ token, onAdded }: { token: string; onAdded: () => void }) {
  const [form, setForm] = useState({
    label: "",
    recipientName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    landmark: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    // P11-I3/A8: line1, city and postalCode are required.
    const errors: Record<string, string> = {};
    if (!form.line1.trim()) errors.line1 = "Address line 1 is required.";
    if (!form.city.trim()) errors.city = "City is required.";
    if (!form.postalCode.trim()) errors.postalCode = "PIN code is required.";
    setFieldErrors(errors);
    setFormError(null);
    setSuccess(false);
    if (Object.keys(errors).length) return;

    const payload: Omit<Address, "id" | "customerId"> = {
      label: form.label.trim() || "Address",
      recipientName: form.recipientName.trim(),
      phone: form.phone.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      landmark: form.landmark.trim(),
    };

    setSubmitting(true);
    try {
      await client.addAddress(token, payload);
      setForm({ label: "", recipientName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", landmark: "" });
      setSuccess(true);
      onAdded();
    } catch (err) {
      if (isApiError(err)) {
        setFormError(err.message);
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="h-fit">
      <CardTitle>Add address</CardTitle>
      {formError && (
        <div className="mb-4">
          <ErrorBanner message={formError} />
        </div>
      )}
      {success && !formError && <p className="mb-4 text-sm text-ok-fg">Address added.</p>}
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Label" hint="optional">
          <Input placeholder="Home, Office…" value={form.label} onChange={(e) => set("label", e.target.value)} />
        </Field>
        <FieldRow>
          <Field label="Recipient name" hint="optional">
            <Input value={form.recipientName} onChange={(e) => set("recipientName", e.target.value)} />
          </Field>
          <Field label="Phone" hint="optional">
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
        </FieldRow>
        <Field label="Address line 1" error={fieldErrors.line1}>
          <Input value={form.line1} onChange={(e) => set("line1", e.target.value)} error={!!fieldErrors.line1} />
        </Field>
        <Field label="Address line 2" hint="optional">
          <Input value={form.line2} onChange={(e) => set("line2", e.target.value)} />
        </Field>
        <FieldRow>
          <Field label="City" error={fieldErrors.city}>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} error={!!fieldErrors.city} />
          </Field>
          <Field label="PIN code" error={fieldErrors.postalCode}>
            <Input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} error={!!fieldErrors.postalCode} />
          </Field>
        </FieldRow>
        <Field label="State" hint="optional">
          <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
        </Field>
        <Field label="Landmark" hint="optional">
          <Input value={form.landmark} onChange={(e) => set("landmark", e.target.value)} />
        </Field>
        <Button type="submit" block disabled={submitting} className="mt-1">
          {submitting ? "Saving…" : "Add address"}
        </Button>
      </form>
    </Card>
  );
}

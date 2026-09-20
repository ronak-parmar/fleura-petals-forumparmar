"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import * as client from "@/lib/api/client";
import { isApiError } from "@/lib/useAsync";
import type { Order, OrderStatus, DeliverySlot } from "@/lib/api/types";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { Eyebrow, ErrorBanner } from "@/components/ui/Misc";
import { Timeline, type TimelineStep } from "@/components/ui/Timeline";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SLOT_LABEL: Record<DeliverySlot, string> = {
  morning: "Morning (9am–12pm)",
  afternoon: "Afternoon (12pm–4pm)",
  evening: "Evening (4pm–8pm)",
};

const STEP_FLOW: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Order placed" },
  { key: "confirmed", label: "Confirmed by the studio" },
  { key: "in_preparation", label: "In preparation" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

function formatDateLong(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function buildSteps(order: Order): TimelineStep[] {
  const currentIndex = STEP_FLOW.findIndex((s) => s.key === order.status);
  return STEP_FLOW.map((s, i) => {
    let detail: string | undefined;
    if (s.key === "pending") detail = `Placed ${formatDateTime(order.placedAt)}`;
    if (s.key === "delivered") {
      detail =
        i <= currentIndex
          ? "Delivered"
          : `Expected ${formatDateLong(order.deliveryDate)}, ${SLOT_LABEL[order.deliverySlot]}`;
    }
    return {
      label: s.label,
      detail,
      state: i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming",
    };
  });
}

function TrackForm() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") ?? "");
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ orderNumber?: string; email?: string }>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs: typeof fieldErrors = {};
    if (!orderNumber.trim()) errs.orderNumber = "Order number is required.";
    if (!email.trim()) errs.email = "E-mail is required.";
    else if (!emailRe.test(email.trim())) errs.email = "Enter a valid e-mail address.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setFormError(undefined);
    setOrder(null);
    setLoading(true);
    try {
      // Wrong e-mail and unknown order number both come back as the exact
      // same ApiError from client.getOrder — nothing here narrows which part
      // was wrong (P7-I3 / P7-I4).
      const found = await client.getOrder(orderNumber.trim(), email.trim());
      setOrder(found);
    } catch (err) {
      setOrder(null);
      setFormError(isApiError(err) ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const steps = order && order.status !== "cancelled" ? buildSteps(order) : [];

  return (
    <>
      <Eyebrow>Track order</Eyebrow>
      <h1 className="mb-6 font-display text-[2rem] text-ink">
        {order ? `Order ${order.orderNumber}` : "Track your order"}
      </h1>

      <Card className="mb-6 max-w-xl">
        <form onSubmit={onSubmit} noValidate>
          <Field label="Order number" error={fieldErrors.orderNumber}>
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              error={!!fieldErrors.orderNumber}
              placeholder="FP-2026-000042"
            />
          </Field>
          <Field label="E-mail" error={fieldErrors.email}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!fieldErrors.email}
              placeholder="you@example.com"
            />
          </Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Looking up…" : "Track"}
          </Button>
        </form>
      </Card>

      {formError && (
        <div className="mb-6 max-w-xl">
          <ErrorBanner message={formError} />
        </div>
      )}

      {order && order.status !== "cancelled" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardTitle>Where your order is</CardTitle>
            <Timeline steps={steps} />
          </Card>
          <div>
            <div className="rounded-card border border-border bg-surface-2 p-5.5">
              <h3 className="mb-2.5 font-display text-lg text-ink">Order</h3>
              {order.items.map((item) => (
                <div key={item.productId} className="flex justify-between py-1.5 text-sm">
                  <span>
                    {item.productName} × {item.quantity}
                  </span>
                  <span>₹{item.lineTotal.toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-border-strong pt-3 text-base font-bold">
                <span>Total</span>
                <span>₹{order.total.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <Card className="mt-4">
              <CardTitle>Delivery</CardTitle>
              <p className="text-sm text-text-muted">
                {order.recipientName}
                <br />
                {order.addressLine1}
                {order.addressLine2 && <>, {order.addressLine2}</>}
                <br />
                {order.city} {order.postalCode}
                <br />
                <br />
                {formatDateLong(order.deliveryDate)} · {SLOT_LABEL[order.deliverySlot]}
              </p>
            </Card>
          </div>
        </div>
      )}

      {order && order.status === "cancelled" && (
        <ErrorBanner message="This order was cancelled and will not be delivered." />
      )}
    </>
  );
}

export default function TrackPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:px-11 sm:py-14">
        <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
          <TrackForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

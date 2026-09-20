"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/features/cart/CartContext";
import * as client from "@/lib/api/client";
import { isApiError } from "@/lib/useAsync";
import type { DeliverySlot, PlaceOrderPayload } from "@/lib/api/types";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, FieldRow, Input, Select, Textarea } from "@/components/ui/Field";
import { Eyebrow, ErrorBanner } from "@/components/ui/Misc";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GIFT_MESSAGE_MAX = 240;

const SLOT_OPTIONS: { value: DeliverySlot; label: string }[] = [
  { value: "morning", label: "Morning (9am – 12pm)" },
  { value: "afternoon", label: "Afternoon (12pm – 4pm)" },
  { value: "evening", label: "Evening (4pm – 8pm)" },
];

function toDateInputValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d);
}

interface DeliveryForm {
  recipientName: string;
  line1: string;
  city: string;
  postalCode: string;
  landmark: string;
  date: string;
  slot: DeliverySlot;
}

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const { lines, subtotal, deliveryFee, total, clear } = cart;

  // Cart state hydrates from localStorage a tick after mount (see CartContext),
  // so we defer the empty-cart check to the next macrotask to avoid a false
  // redirect on a hard refresh / direct navigation to /checkout.
  const [readyToCheckEmpty, setReadyToCheckEmpty] = useState(false);
  // Set right before we clear() the cart on a successful order, so the empty-cart
  // guard below doesn't race the navigation to the confirmation page and win —
  // clearing the cart makes lines.length hit 0 a tick before router.push resolves,
  // which would otherwise redirect back to /cart instead of /order/confirmed/....
  const navigatingAwayRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => setReadyToCheckEmpty(true), 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (readyToCheckEmpty && lines.length === 0 && !navigatingAwayRef.current) {
      router.replace("/cart");
    }
  }, [readyToCheckEmpty, lines.length, router]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const minDate = useMemo(() => {
    let minDays = 1;
    for (const l of lines) {
      const days = l.nature === "everlasting" ? l.leadTimeDays : 1;
      if (days > minDays) minDays = days;
    }
    const d = new Date(today);
    d.setDate(d.getDate() + minDays);
    return d;
  }, [lines, today]);

  const minDateStr = toDateInputValue(minDate);

  const leadTimeHint = useMemo(() => {
    if (lines.length === 0) return "";
    const longestLine = lines.reduce((longest, l) => {
      const days = l.nature === "everlasting" ? l.leadTimeDays : 1;
      const longestDays = longest.nature === "everlasting" ? longest.leadTimeDays : 1;
      return days > longestDays ? l : longest;
    }, lines[0]);
    return longestLine.nature === "everlasting"
      ? `Earliest for your cart: ${formatDateShort(minDateStr)} (${longestLine.name} needs ${longestLine.leadTimeDays} days)`
      : `Earliest for your cart: ${formatDateShort(minDateStr)}`;
  }, [lines, minDateStr]);

  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [delivery, setDelivery] = useState<DeliveryForm>({
    recipientName: "",
    line1: "",
    city: "",
    postalCode: "",
    landmark: "",
    date: "",
    slot: "morning",
  });
  const [giftMessage, setGiftMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!contact.name.trim()) errs["contact.name"] = "Name is required.";
    if (!contact.email.trim()) errs["contact.email"] = "E-mail is required.";
    else if (!emailRe.test(contact.email.trim())) errs["contact.email"] = "Enter a valid e-mail address.";
    if (!contact.phone.trim()) errs["contact.phone"] = "Phone is required.";
    if (!delivery.recipientName.trim()) errs["delivery.recipientName"] = "Recipient name is required.";
    if (!delivery.line1.trim()) errs["delivery.line1"] = "Address line 1 is required.";
    if (!delivery.city.trim()) errs["delivery.city"] = "City is required.";
    if (!/^\d{6}$/.test(delivery.postalCode.trim())) errs["delivery.postalCode"] = "Enter a 6-digit PIN code.";
    if (!delivery.date) errs["delivery.date"] = "Delivery date is required.";
    else if (delivery.date < minDateStr) errs["delivery.date"] = "Please pick a valid delivery date.";
    return errs;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;

    const errs = validate();
    setFieldErrors(errs);
    setFormError(undefined);
    if (Object.keys(errs).length > 0) return;

    submittingRef.current = true;
    setSubmitting(true);

    const payload: PlaceOrderPayload = {
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      contact: { name: contact.name.trim(), email: contact.email.trim(), phone: contact.phone.trim() },
      delivery: {
        recipientName: delivery.recipientName.trim(),
        phone: contact.phone.trim(),
        line1: delivery.line1.trim(),
        city: delivery.city.trim(),
        postalCode: delivery.postalCode.trim(),
        landmark: delivery.landmark.trim() || undefined,
        date: delivery.date,
        slot: delivery.slot,
      },
      giftMessage: giftMessage.trim() || undefined,
    };

    try {
      const order = await client.placeOrder(payload);
      try {
        sessionStorage.setItem("fleurea-last-order-email", payload.contact.email);
      } catch {
        /* sessionStorage unavailable — confirmation page will just show a generic message */
      }
      navigatingAwayRef.current = true;
      clear();
      router.push(`/order/confirmed/${order.orderNumber}`);
    } catch (err) {
      if (isApiError(err)) {
        const fe: Record<string, string> = { ...(err.fieldErrors ?? {}) };
        if (err.code === "DELIVERY_TOO_SOON") {
          fe["delivery.date"] = err.message;
        } else {
          setFormError(err.message);
        }
        setFieldErrors(fe);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:px-11 sm:py-14" />
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:px-11 sm:py-14">
        <Eyebrow>Checkout</Eyebrow>
        <h1 className="mb-6 font-display text-[2rem] text-ink">Delivery details</h1>

        {formError && (
          <div className="mb-5">
            <ErrorBanner message={formError} />
          </div>
        )}

        <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.6fr_1fr]" noValidate>
          <div>
            <Card className="mb-4.5">
              <CardTitle>Contact</CardTitle>
              <FieldRow>
                <Field label="Full name" error={fieldErrors["contact.name"]}>
                  <Input
                    value={contact.name}
                    onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                    error={!!fieldErrors["contact.name"]}
                  />
                </Field>
                <Field label="Phone" error={fieldErrors["contact.phone"]}>
                  <Input
                    value={contact.phone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                    error={!!fieldErrors["contact.phone"]}
                  />
                </Field>
              </FieldRow>
              <Field label="Email" hint="— we send your order number here" error={fieldErrors["contact.email"]}>
                <Input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  error={!!fieldErrors["contact.email"]}
                />
              </Field>
            </Card>

            <Card className="mb-4.5">
              <CardTitle>Delivery address</CardTitle>
              <Field label="Recipient name" error={fieldErrors["delivery.recipientName"]}>
                <Input
                  value={delivery.recipientName}
                  onChange={(e) => setDelivery((d) => ({ ...d, recipientName: e.target.value }))}
                  error={!!fieldErrors["delivery.recipientName"]}
                />
              </Field>
              <Field label="Address line 1" error={fieldErrors["delivery.line1"]}>
                <Input
                  value={delivery.line1}
                  onChange={(e) => setDelivery((d) => ({ ...d, line1: e.target.value }))}
                  error={!!fieldErrors["delivery.line1"]}
                />
              </Field>
              <FieldRow>
                <Field label="City" error={fieldErrors["delivery.city"]}>
                  <Input
                    value={delivery.city}
                    onChange={(e) => setDelivery((d) => ({ ...d, city: e.target.value }))}
                    error={!!fieldErrors["delivery.city"]}
                  />
                </Field>
                <Field label="PIN code" error={fieldErrors["delivery.postalCode"]}>
                  <Input
                    value={delivery.postalCode}
                    onChange={(e) =>
                      setDelivery((d) => ({ ...d, postalCode: e.target.value.replace(/\D/g, "").slice(0, 6) }))
                    }
                    error={!!fieldErrors["delivery.postalCode"]}
                    inputMode="numeric"
                  />
                </Field>
              </FieldRow>
              <Field label="Landmark" hint="optional">
                <Input
                  value={delivery.landmark}
                  onChange={(e) => setDelivery((d) => ({ ...d, landmark: e.target.value }))}
                />
              </Field>
            </Card>

            <Card className="mb-4.5">
              <CardTitle>Delivery date &amp; slot</CardTitle>
              <FieldRow>
                <Field label="Date" error={fieldErrors["delivery.date"]} hint={leadTimeHint || undefined}>
                  <Input
                    type="date"
                    min={minDateStr}
                    value={delivery.date}
                    onChange={(e) => setDelivery((d) => ({ ...d, date: e.target.value }))}
                    error={!!fieldErrors["delivery.date"]}
                  />
                </Field>
                <Field label="Time slot">
                  <Select
                    value={delivery.slot}
                    onChange={(e) => setDelivery((d) => ({ ...d, slot: e.target.value as DeliverySlot }))}
                  >
                    {SLOT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </FieldRow>
            </Card>

            <Card>
              <CardTitle>
                Gift message <span className="font-normal text-text-muted">optional</span>
              </CardTitle>
              <Textarea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value.slice(0, GIFT_MESSAGE_MAX))}
                maxLength={GIFT_MESSAGE_MAX}
                rows={3}
                placeholder="Happy birthday, Ma — these won't wilt, just like you asked."
              />
              <p
                className={`mt-1.5 text-right text-xs ${
                  giftMessage.length >= GIFT_MESSAGE_MAX ? "text-warn-fg" : "text-text-muted"
                }`}
              >
                {giftMessage.length}/{GIFT_MESSAGE_MAX}
              </p>
            </Card>
          </div>

          <div>
            <div className="h-max rounded-card border border-border bg-surface-2 p-5.5">
              <h3 className="mb-3 font-display text-lg text-ink">Order review</h3>
              {lines.map((l) => (
                <div key={l.productId} className="flex justify-between py-1.5 text-sm">
                  <span>
                    {l.name} × {l.quantity}
                  </span>
                  <span>₹{(l.price * l.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t border-border pt-2 text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1.5 text-sm">
                <span>Delivery fee</span>
                <span>₹{deliveryFee.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border-strong pt-3 text-base font-bold">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
              <Button type="submit" block disabled={submitting} className="mt-4">
                {submitting ? "Placing order…" : "Place order"}
              </Button>
              <p className="mt-2.5 text-center text-[11.5px] text-text-muted">
                Pay on delivery. No payment is taken now.
              </p>
            </div>
          </div>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

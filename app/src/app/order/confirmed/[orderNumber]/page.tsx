"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import * as client from "@/lib/api/client";
import { useAsync, isApiError } from "@/lib/useAsync";
import type { Order, DeliverySlot } from "@/lib/api/types";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Eyebrow, EmptyState, ErrorBanner } from "@/components/ui/Misc";

const EMAIL_KEY = "fleurea-last-order-email";

const SLOT_LABEL: Record<DeliverySlot, string> = {
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
};

function formatDateLong(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export default function OrderConfirmedPage() {
  const params = useParams();
  const orderNumber = (params.orderNumber as string) ?? "";

  // The mock "database" has no server session — we stash the e-mail used at
  // checkout in sessionStorage right after placeOrder() succeeds, and read it
  // back here (survives a refresh, scoped to this tab only).
  const [email, setEmail] = useState<string | null>(null);
  const [emailChecked, setEmailChecked] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(EMAIL_KEY);
    } catch {
      /* sessionStorage unavailable — we'll fetch with an empty e-mail below */
    }
    setEmail(stored);
    setEmailChecked(true);
  }, []);

  const { data: order, error, loading } = useAsync<Order>(() => {
    if (!emailChecked) return new Promise<Order>(() => {}); // stay in "loading" until we've checked sessionStorage
    return client.getOrder(orderNumber, email ?? "");
  }, [orderNumber, email, emailChecked]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 text-center sm:px-11 sm:py-14">
        {loading && <p className="text-sm text-text-muted">Loading your order…</p>}

        {!loading && error && (
          isApiError(error) && error.status === 404 ? (
            <EmptyState
              title="We couldn't find that order"
              body="Double-check the link, or look it up on the track order page with the order number and e-mail you used."
              action={<Button href="/track">Track an order</Button>}
            />
          ) : (
            <ErrorBanner message={isApiError(error) ? error.message : "Something went wrong. Please try again."} />
          )
        )}

        {!loading && !error && order && (
          <>
            <div className="mx-auto mb-4.5 mt-2 flex h-14 w-14 items-center justify-center rounded-full bg-ok-bg text-2xl text-ok-fg">
              ✓
            </div>
            <Eyebrow center>Order placed</Eyebrow>
            <h1 className="mb-2.5 font-display text-[2rem] text-ink">
              Thank you, {order.recipientName.split(" ")[0]}.
            </h1>
            <p className="mx-auto mb-2 max-w-[46ch] text-sm text-text-muted">
              Your order is in.{" "}
              {email && (
                <>
                  We&rsquo;ve e-mailed the details to <b className="text-ink">{email}</b>.{" "}
                </>
              )}
              Save your order number to track it later.
            </p>
            <p className="my-4.5 font-mono text-xl font-bold tracking-wide text-accent-ink">{order.orderNumber}</p>

            <div className="mx-auto mt-6 max-w-[460px] rounded-card border border-border bg-surface-2 p-5.5 text-left">
              {order.items.map((item) => (
                <div key={item.productId} className="flex justify-between py-1.5 text-sm">
                  <span>
                    {item.productName} × {item.quantity}
                  </span>
                  <span>₹{item.lineTotal.toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="flex justify-between py-1.5 text-sm">
                <span>
                  Delivery · {formatDateLong(order.deliveryDate)}, {SLOT_LABEL[order.deliverySlot]}
                </span>
                <span>₹{order.deliveryFee.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border-strong pt-3 text-base font-bold">
                <span>Total (pay on delivery)</span>
                <span>₹{order.total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <Button href={`/track?order=${encodeURIComponent(order.orderNumber)}`}>Track this order</Button>
              <Button href="/shop" variant="ghost">
                Back to shop
              </Button>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

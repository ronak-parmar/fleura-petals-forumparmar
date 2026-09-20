"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eyebrow, EmptyState } from "@/components/ui/Misc";
import { useAsync } from "@/lib/useAsync";
import * as client from "@/lib/api/client";
import { ApiError } from "@/lib/api/types";
import type { CustomRequest } from "@/lib/api/types";

const LAST_REQUEST_EMAIL_KEY = "fleurea-last-request-email";

const BOUQUET_TYPE_LABEL: Record<string, string> = {
  ribbon: "Ribbon-wound (everlasting)",
  fresh: "Fresh flowers",
  mixed: "Mixed ribbon & fresh",
};
const SIZE_LABEL: Record<string, string> = {
  posy: "Posy",
  standard: "Standard",
  large: "Large",
  event: "Event / installation",
};

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(d);
}

function summarise(request: CustomRequest) {
  const parts = [
    BOUQUET_TYPE_LABEL[request.bouquetType] ?? request.bouquetType,
    request.occasion,
    request.palette,
    SIZE_LABEL[request.size] ?? request.size,
    request.budgetMin || request.budgetMax
      ? `budget ₹${request.budgetMin.toLocaleString("en-IN")}–₹${request.budgetMax.toLocaleString("en-IN")}`
      : null,
    request.needByDate ? `needed by ${formatDate(request.needByDate)}` : null,
  ];
  return parts.filter((p) => p && p.trim().length > 0).join(" · ");
}

export default function CustomRequestReceivedPage() {
  const params = useParams<{ requestNumber: string }>();
  const requestNumber = params.requestNumber;

  // This route only carries the request number in the URL. The e-mail needed
  // to look it up was stashed in sessionStorage right after a successful
  // submit on /custom (see LAST_REQUEST_EMAIL_KEY there). Read synchronously
  // via a lazy initializer — sessionStorage is available on first client
  // render, so this needs no effect (and no setState-in-effect flash).
  const [email] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem(LAST_REQUEST_EMAIL_KEY);
    } catch {
      return null;
    }
  });

  const { data: request, error, loading } = useAsync(() => {
    if (!email) {
      return Promise.reject(
        new ApiError("No request found for that number and e-mail.", "REQUEST_NOT_FOUND", 404)
      );
    }
    return client.getCustomRequest(requestNumber, email);
  }, [requestNumber, email]);

  const notFound = !loading && (!!error || !request);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-10 sm:px-11">
        <div className="mx-auto max-w-[680px] text-center">
          {loading && <p className="text-text-muted">Loading…</p>}

          {notFound && (
            <EmptyState
              title="We couldn't find that request"
              body="Check the request number, or start a new custom request and we'll get right on it."
              action={<Button href="/custom">Start a custom request</Button>}
            />
          )}

          {!loading && request && (
            <>
              <div className="mx-auto mb-4.5 flex h-14 w-14 items-center justify-center rounded-full bg-info-bg text-2xl text-info-fg">
                ✿
              </div>
              <Eyebrow center>Request received</Eyebrow>
              <h1 className="font-display text-3xl text-ink sm:text-4xl">We&rsquo;ll be in touch soon.</h1>
              <p className="mx-auto mt-2.5 max-w-[48ch] text-text-muted">
                Thanks, {request.contactName.split(" ")[0]}. We&rsquo;ve got your custom bouquet request and
                will reply to <span className="font-semibold text-ink">{request.contactEmail}</span> with a
                few options and a rough quote, usually within two working days.
              </p>
              <p className="mt-4.5 font-mono text-lg font-bold tracking-wide text-rosewood">
                {request.requestNumber}
              </p>

              <Card className="mx-auto mt-5 max-w-[440px] text-left">
                <CardTitle>What you asked for</CardTitle>
                <p className="text-[0.85rem] text-text-muted">{summarise(request)}</p>
              </Card>

              <div className="mt-5.5 flex flex-wrap justify-center gap-3">
                <Button href={`/custom/received/${request.requestNumber}`}>Track this request</Button>
                <Button variant="ghost" href="/shop">
                  Back to shop
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

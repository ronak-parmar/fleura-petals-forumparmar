"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field, FieldRow, Input, Textarea, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Eyebrow, ErrorBanner } from "@/components/ui/Misc";
import { useAsync, isApiError } from "@/lib/useAsync";
import * as client from "@/lib/api/client";
import type { BouquetSize, BouquetType, CreateCustomRequestPayload } from "@/lib/api/types";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LAST_REQUEST_EMAIL_KEY = "fleurea-last-request-email";

export default function CustomRequestPage() {
  return (
    <Suspense fallback={null}>
      <CustomRequestForm />
    </Suspense>
  );
}

function CustomRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSlug = searchParams.get("from");

  const { data: fromProduct } = useAsync(
    () => (fromSlug ? client.getProduct(fromSlug) : Promise.resolve(null)),
    [fromSlug]
  );
  const prefilledFromProduct = useRef(false);

  const [bouquetType, setBouquetType] = useState<BouquetType | "">("");
  const [occasion, setOccasion] = useState("");
  const [palette, setPalette] = useState("");
  const [flowersPreferred, setFlowersPreferred] = useState("");
  const [size, setSize] = useState<BouquetSize | "">("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [needByDate, setNeedByDate] = useState("");
  const [referenceNotes, setReferenceNotes] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [inspirationImageUrl, setInspirationImageUrl] = useState<string | null>(null);
  const [inspirationFileName, setInspirationFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill once when opened as /custom?from={slug} (P8-L2) — only ever runs
  // once so it never clobbers something the visitor has already typed.
  useEffect(() => {
    if (!fromProduct || prefilledFromProduct.current) return;
    prefilledFromProduct.current = true;
    setBouquetType(fromProduct.nature === "fresh" ? "fresh" : "ribbon");
    setReferenceNotes((notes) => notes || `Based on ${fromProduct.name}.`);
  }, [fromProduct]);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const { url } = await client.uploadInspirationImage(file);
      setInspirationImageUrl(url);
      setInspirationFileName(file.name);
    } catch (err) {
      setInspirationImageUrl(null);
      setInspirationFileName(null);
      setUploadError(isApiError(err) ? err.message : "Could not upload the image.");
    } finally {
      setUploading(false);
    }
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!occasion.trim()) errs.occasion = "Occasion is required.";
    if (!size) errs.size = "Please choose a size.";
    if (!needByDate) {
      errs.needByDate = "Need-by date is required.";
    } else {
      const chosen = new Date(needByDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(chosen.getTime()) || chosen < today) {
        errs.needByDate = "Need-by date can't be in the past.";
      }
    }
    if (!contactName.trim()) errs.contactName = "Name is required.";
    if (!contactEmail.trim() || !emailRe.test(contactEmail)) errs.contactEmail = "A valid e-mail is required.";
    if (!contactPhone.trim()) errs.contactPhone = "Phone is required.";
    if (budgetMin && budgetMax && Number(budgetMin) > Number(budgetMax)) {
      errs.budgetMin = "Minimum budget cannot be more than the maximum.";
    }
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const errs = validate();
    setFieldErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const payload: CreateCustomRequestPayload = {
        bouquetType: (bouquetType || "mixed") as BouquetType,
        occasion,
        palette,
        flowersPreferred,
        size: size as BouquetSize,
        budgetMin: budgetMin ? Number(budgetMin) : 0,
        budgetMax: budgetMax ? Number(budgetMax) : 0,
        needByDate,
        referenceNotes,
        inspirationImageUrl,
        contactName,
        contactEmail,
        contactPhone,
      };
      const request = await client.createCustomRequest(payload);
      try {
        sessionStorage.setItem(LAST_REQUEST_EMAIL_KEY, contactEmail);
      } catch {
        // sessionStorage unavailable (private browsing etc.) — non-fatal.
      }
      router.push(`/custom/received/${request.requestNumber}`);
    } catch (err) {
      if (isApiError(err)) {
        setFieldErrors(err.fieldErrors ?? {});
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-10 sm:px-11">
        <div className="mx-auto max-w-[820px]">
          <Eyebrow>Custom bouquet</Eyebrow>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">Tell us what you have in mind</h1>
          <p className="mt-2.5 max-w-2xl text-text-muted">
            Describe the bouquet and we&rsquo;ll come back with a rough quote. Nothing is charged now
            &mdash; this starts a conversation.
          </p>

          {fromProduct && (
            <p className="mt-4 text-sm text-text-muted">
              Based on <span className="font-semibold text-ink">{fromProduct.name}</span>.
            </p>
          )}

          {formError && (
            <div className="mt-5">
              <ErrorBanner message={formError} />
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Card className="mt-6">
              <CardTitle>The bouquet</CardTitle>
              <FieldRow>
                <Field label="Type" htmlFor="bouquetType">
                  <Select
                    id="bouquetType"
                    value={bouquetType}
                    onChange={(e) => setBouquetType(e.target.value as BouquetType)}
                  >
                    <option value="">Select a type…</option>
                    <option value="ribbon">Ribbon-wound (everlasting)</option>
                    <option value="fresh">Fresh flowers</option>
                    <option value="mixed">Mixed — ribbon &amp; fresh</option>
                  </Select>
                </Field>
                <Field label="Occasion" htmlFor="occasion" error={fieldErrors.occasion}>
                  <Input
                    id="occasion"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    error={!!fieldErrors.occasion}
                    placeholder="e.g. 25th wedding anniversary"
                  />
                </Field>
              </FieldRow>

              <FieldRow>
                <Field label="Colour palette" hint="optional" htmlFor="palette">
                  <Input
                    id="palette"
                    value={palette}
                    onChange={(e) => setPalette(e.target.value)}
                    placeholder="e.g. Ivory, blush, a little gold"
                  />
                </Field>
                <Field label="Size" htmlFor="size" error={fieldErrors.size}>
                  <Select
                    id="size"
                    value={size}
                    onChange={(e) => setSize(e.target.value as BouquetSize)}
                    error={!!fieldErrors.size}
                  >
                    <option value="">Select a size…</option>
                    <option value="posy">Posy</option>
                    <option value="standard">Standard</option>
                    <option value="large">Large</option>
                    <option value="event">Event / installation</option>
                  </Select>
                </Field>
              </FieldRow>

              <Field label="Flowers you'd like" hint="optional" htmlFor="flowersPreferred">
                <Input
                  id="flowersPreferred"
                  value={flowersPreferred}
                  onChange={(e) => setFlowersPreferred(e.target.value)}
                  placeholder="e.g. Roses and lisianthus, if possible"
                />
              </Field>

              <FieldRow>
                <Field label="Budget (min)" hint="optional" htmlFor="budgetMin" error={fieldErrors.budgetMin}>
                  <Input
                    id="budgetMin"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    error={!!fieldErrors.budgetMin}
                    placeholder="2500"
                  />
                </Field>
                <Field label="Budget (max)" hint="optional" htmlFor="budgetMax">
                  <Input
                    id="budgetMax"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="4000"
                  />
                </Field>
              </FieldRow>

              <Field label="Need it by" htmlFor="needByDate" error={fieldErrors.needByDate}>
                <Input
                  id="needByDate"
                  type="date"
                  value={needByDate}
                  onChange={(e) => setNeedByDate(e.target.value)}
                  error={!!fieldErrors.needByDate}
                />
              </Field>

              <Field label="Notes & references" hint="optional" htmlFor="referenceNotes">
                <Textarea
                  id="referenceNotes"
                  rows={3}
                  value={referenceNotes}
                  onChange={(e) => setReferenceNotes(e.target.value)}
                  placeholder="Something that photographs well on a dinner table. Happy to see options."
                />
              </Field>

              <Field label="Inspiration image" hint="optional" error={uploadError ?? undefined}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full text-sm text-text-muted file:mr-3 file:rounded-full file:border file:border-border-strong file:bg-surface file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-ink"
                />
                {uploading && <p className="mt-1.5 text-xs text-text-muted">Uploading…</p>}
                {inspirationFileName && !uploading && !uploadError && (
                  <div className="mt-2 inline-flex items-center gap-2">
                    <Badge variant="muted">Attached</Badge>
                    <span className="text-sm text-ink">{inspirationFileName}</span>
                  </div>
                )}
              </Field>
            </Card>

            <Card className="mt-4.5">
              <CardTitle>How to reach you</CardTitle>
              <FieldRow>
                <Field label="Name" htmlFor="contactName" error={fieldErrors.contactName}>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    error={!!fieldErrors.contactName}
                  />
                </Field>
                <Field label="Phone" htmlFor="contactPhone" error={fieldErrors.contactPhone}>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    error={!!fieldErrors.contactPhone}
                  />
                </Field>
              </FieldRow>
              <Field label="Email" htmlFor="contactEmail" error={fieldErrors.contactEmail}>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  error={!!fieldErrors.contactEmail}
                />
              </Field>
            </Card>

            <Button type="submit" block className="mt-4.5" disabled={submitting || uploading}>
              {submitting ? "Sending…" : "Send custom request"}
            </Button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

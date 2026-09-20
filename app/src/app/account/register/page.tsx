"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Field, Input, PasswordInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Eyebrow, ErrorBanner } from "@/components/ui/Misc";
import { isApiError } from "@/lib/useAsync";
import * as client from "@/lib/api/client";
import { getCustomerToken, setCustomerToken } from "@/features/account/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // P10-L3: already-logged-in visitors don't see the register form.
  useEffect(() => {
    if (getCustomerToken()) router.replace("/account");
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    // Client-side checks: password length (P10-I3) and e-mail format (P10-I4),
    // plus the required fields (P10-I8). client.ts's mock register() doesn't
    // check e-mail format itself, so this page has to.
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Full name is required.";
    if (!email.trim()) errors.email = "E-mail is required.";
    else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid e-mail address.";
    if (!phone.trim()) errors.phone = "Phone number is required.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      const result = await client.register(name.trim(), email.trim(), phone.trim(), password);
      setCustomerToken(result.token);
      router.push("/account");
    } catch (err) {
      if (isApiError(err)) {
        if (err.code === "EMAIL_TAKEN") {
          setFieldErrors((f) => ({ ...f, email: err.message }));
        }
        setFormError(err.message);
        if (err.fieldErrors) setFieldErrors((f) => ({ ...f, ...err.fieldErrors }));
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-14 sm:px-11">
        <div className="w-full max-w-md">
          <Eyebrow center>Account</Eyebrow>
          <h1 className="mb-6 text-center font-display text-[34px] text-ink">Create an account</h1>

          <Card>
            {formError && (
              <div className="mb-4">
                <ErrorBanner message={formError} />
              </div>
            )}
            <form onSubmit={handleSubmit} noValidate>
              <Field label="Full name" htmlFor="reg-name" error={fieldErrors.name}>
                <Input
                  id="reg-name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={!!fieldErrors.name}
                />
              </Field>
              <Field label="E-mail" htmlFor="reg-email" error={fieldErrors.email}>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!fieldErrors.email}
                />
              </Field>
              <Field label="Phone" htmlFor="reg-phone" error={fieldErrors.phone}>
                <Input
                  id="reg-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={!!fieldErrors.phone}
                />
              </Field>
              <Field label="Password" hint="at least 8 characters" htmlFor="reg-password" error={fieldErrors.password}>
                <PasswordInput
                  id="reg-password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!fieldErrors.password}
                />
              </Field>
              <Button type="submit" block disabled={submitting} className="mt-1">
                {submitting ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </Card>

          <p className="mt-5 text-center text-sm text-text-muted">
            Already have an account?{" "}
            <Link href="/account/login" className="font-semibold text-rosewood hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

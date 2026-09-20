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

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // P10-L3: already-logged-in visitors don't see the login form.
  useEffect(() => {
    if (getCustomerToken()) router.replace("/account");
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = "E-mail is required.";
    if (!password) errors.password = "Password is required.";
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      const result = await client.login(email.trim(), password);
      setCustomerToken(result.token);
      router.push("/account");
    } catch (err) {
      // P10-I6/I7: never reveal whether the e-mail or the password was wrong.
      if (isApiError(err)) {
        setFormError("E-mail or password is incorrect.");
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
          <h1 className="mb-6 text-center font-display text-[34px] text-ink">Log in</h1>

          <Card>
            {formError && (
              <div className="mb-4">
                <ErrorBanner message={formError} />
              </div>
            )}
            <form onSubmit={handleSubmit} noValidate>
              <Field label="E-mail" htmlFor="login-email" error={fieldErrors.email}>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!fieldErrors.email}
                />
              </Field>
              <Field label="Password" htmlFor="login-password" error={fieldErrors.password}>
                <PasswordInput
                  id="login-password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!fieldErrors.password}
                />
              </Field>
              <Button type="submit" block disabled={submitting} className="mt-1">
                {submitting ? "Logging in…" : "Log in"}
              </Button>
            </form>
          </Card>

          <p className="mt-5 text-center text-sm text-text-muted">
            New here?{" "}
            <Link href="/account/register" className="font-semibold text-rosewood hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import * as client from "@/lib/api/client";
import { isApiError } from "@/lib/useAsync";
import { getAdminToken, setAdminSession } from "@/features/admin/session";
import { BrandMark } from "@/components/layout/BrandMark";
import { Card } from "@/components/ui/Card";
import { Field, Input, PasswordInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Misc";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  // P12-L2 — already signed in -> redirect to /admin.
  useEffect(() => {
    if (getAdminToken()) {
      router.replace("/admin");
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: { username?: string; password?: string } = {};
    if (!username.trim()) errs.username = "Username is required.";
    if (!password) errs.password = "Password is required.";
    setFieldErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const { token } = await client.adminLogin(username.trim(), password);
      setAdminSession(token, "Forum Parmar");
      router.push("/admin");
    } catch (e) {
      // P12-I2 / P12-I3 — generic message, never reveal which field was wrong.
      setFormError(isApiError(e) ? e.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-4 py-12">
      <BrandMark className="mb-6" />
      <Card className="w-full max-w-[380px]">
        <h1 className="mb-1 font-display text-xl italic text-ink">Studio sign in</h1>
        <p className="mb-5 text-sm text-text-muted">For Fleuréa Petals staff only.</p>

        {formError && (
          <div className="mb-4">
            <ErrorBanner message={formError} />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Username" error={fieldErrors.username} htmlFor="admin-username">
            <Input
              id="admin-username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!fieldErrors.username}
            />
          </Field>
          <Field label="Password" error={fieldErrors.password} htmlFor="admin-password">
            <PasswordInput
              id="admin-password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!fieldErrors.password}
            />
          </Field>
          <Button type="submit" block disabled={submitting} className="mt-1.5">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

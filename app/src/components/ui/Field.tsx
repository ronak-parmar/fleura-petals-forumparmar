"use client";

import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const controlCls =
  "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-rosewood/30";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-ink">
        {label} {hint && <span className="font-normal text-text-muted">{hint}</span>}
      </label>
      {children}
      {error && <span className="text-xs text-dang-fg">{error}</span>}
    </div>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">{children}</div>;
}

export function Input({ error, className = "", ...rest }: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return <input className={`${controlCls} ${error ? "border-dang-fg" : "border-border-strong"} ${className}`} {...rest} />;
}

export function PasswordInput({ error, className = "", ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { error?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className={`${controlCls} pr-16 ${error ? "border-dang-fg" : "border-border-strong"} ${className}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 px-3.5 text-xs font-semibold text-text-muted hover:text-ink"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function Textarea({ error, className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return <textarea className={`${controlCls} ${error ? "border-dang-fg" : "border-border-strong"} ${className}`} {...rest} />;
}

export function Select({ error, className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select className={`${controlCls} ${error ? "border-dang-fg" : "border-border-strong"} ${className}`} {...rest}>
      {children}
    </select>
  );
}

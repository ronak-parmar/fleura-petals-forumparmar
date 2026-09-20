import type { ReactNode } from "react";

export function PriceTag({ amount, className = "" }: { amount: number; className?: string }) {
  return (
    <span className={`font-mono font-bold text-accent-ink ${className}`}>
      ₹{amount.toLocaleString("en-IN")}
    </span>
  );
}

export function Eyebrow({ children, center = false }: { children: ReactNode; center?: boolean }) {
  return (
    <p className={`mb-2.5 font-mono text-[0.7rem] tracking-[0.16em] text-gold-ink uppercase ${center ? "text-center" : ""}`}>
      {children}
    </p>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-dang-fg/30 bg-dang-bg px-4 py-3 text-sm text-dang-fg" role="alert">
      {message}
    </div>
  );
}

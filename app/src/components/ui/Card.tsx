import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`rounded-card border border-border bg-surface p-5.5 sm:p-6 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h3 className={`mb-3.5 text-[0.95rem] font-bold text-ink ${className}`}>{children}</h3>;
}

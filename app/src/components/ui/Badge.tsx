import type { ReactNode } from "react";

const variants = {
  ok: "bg-ok-bg text-ok-fg",
  warn: "bg-warn-bg text-warn-fg",
  info: "bg-info-bg text-info-fg",
  dang: "bg-dang-bg text-dang-fg",
  muted: "bg-surface-2 text-text-muted",
};

export function Badge({
  variant = "muted",
  children,
  className = "",
}: {
  variant?: keyof typeof variants;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

/** Maps an OrderStatus / CustomRequestStatus / ProductAvailability to a badge variant + label. */
export const STATUS_BADGE: Record<string, { variant: keyof typeof variants; label: string }> = {
  pending: { variant: "warn", label: "Pending" },
  confirmed: { variant: "info", label: "Confirmed" },
  in_preparation: { variant: "info", label: "In preparation" },
  ready: { variant: "info", label: "Ready" },
  out_for_delivery: { variant: "info", label: "Out for delivery" },
  delivered: { variant: "ok", label: "Delivered" },
  cancelled: { variant: "muted", label: "Cancelled" },
  new: { variant: "info", label: "New" },
  reviewing: { variant: "info", label: "Reviewing" },
  quoted: { variant: "warn", label: "Quoted" },
  accepted: { variant: "ok", label: "Accepted" },
  declined: { variant: "muted", label: "Declined" },
  converted_to_order: { variant: "ok", label: "Converted" },
  closed: { variant: "muted", label: "Closed" },
  available: { variant: "ok", label: "Available" },
  made_to_order: { variant: "warn", label: "Made to order" },
  sold_out: { variant: "dang", label: "Sold out" },
};

export function StatusBadge({ status }: { status: string }) {
  const info = STATUS_BADGE[status] ?? { variant: "muted" as const, label: status };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

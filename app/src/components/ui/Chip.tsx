import type { ButtonHTMLAttributes } from "react";

export function Chip({
  active = false,
  className = "",
  ...rest
}: { active?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? "border-rosewood bg-rosewood text-white"
          : "border-border-strong bg-surface text-text-muted hover:text-ink"
      } ${className}`}
      {...rest}
    />
  );
}

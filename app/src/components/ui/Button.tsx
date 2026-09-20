import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";
const variants = {
  primary: "bg-rosewood text-white hover:bg-accent-ink",
  ghost: "bg-transparent border border-border-strong text-ink hover:bg-surface-2",
};
const sizes = {
  default: "text-sm px-6 py-2.5",
  sm: "text-xs px-4 py-2",
};

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

interface CommonProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = CommonProps & { href: string };

export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "default", block, children, className = "", ...rest } = props;
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${block ? "w-full" : ""} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}

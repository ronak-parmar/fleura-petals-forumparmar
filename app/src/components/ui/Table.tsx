import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full min-w-[560px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead className="bg-surface-2">{children}</thead>;
}

export function Th({ children, className = "", ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-3.5 py-2.5 text-left text-xs font-bold tracking-wide text-text-muted uppercase ${className}`} {...rest}>
      {children}
    </th>
  );
}

export function Td({ children, className = "", ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`border-t border-border px-3.5 py-2.5 align-top ${className}`} {...rest}>
      {children}
    </td>
  );
}

export function Tr({ children, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...rest}>{children}</tr>;
}

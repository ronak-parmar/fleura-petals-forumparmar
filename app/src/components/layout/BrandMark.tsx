import Link from "next/link";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-display text-xl italic text-rosewood ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" className="h-5.5 w-5.5" aria-hidden="true">
        <path d="M12 15c-2-3-6-3.6-9-2 1 3.4 4.6 5.4 9 4.4C16.4 18.4 20 16.4 21 13c-3-1.6-7-1-9 2Z" />
      </svg>
      Fleuréa
    </Link>
  );
}

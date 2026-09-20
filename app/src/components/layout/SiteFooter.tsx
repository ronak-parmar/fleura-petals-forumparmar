import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink px-6 py-9 text-[#e9d9cf] sm:px-11">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
        <div>
          <div className="font-display text-xl italic text-[#f2ddd0]">Fleuréa</div>
          <p className="mt-1.5 max-w-xs text-sm text-[#d8bfb2]">
            Ribbon-wound blooms and fresh seasonal arrangements, made by hand and gifted with care.
          </p>
        </div>
        <ul className="flex gap-5.5 text-sm text-[#d8bfb2]">
          <li><Link href="/shop" className="hover:text-white">Shop</Link></li>
          <li><Link href="/custom" className="hover:text-white">Custom orders</Link></li>
          <li><Link href="/track" className="hover:text-white">Track order</Link></li>
        </ul>
      </div>
      <div className="mt-7 border-t border-[#5c463c] pt-4.5 text-xs text-[#b09a8d]">
        <Link href="/admin/login" className="hover:text-white">
          Admin sign in
        </Link>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function AccountBreadcrumb({ items }: { items: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
      <Link href="/" className="hover:text-[#00b14f]">Trang chủ</Link>
      {items.map((label, i) => (
        <span key={label} className="flex items-center gap-2">
          <ChevronRight size={14} />
          <span className={i === items.length - 1 ? "font-medium text-slate-900 dark:text-slate-100" : undefined}>
            {label}
          </span>
        </span>
      ))}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronRight, Ticket, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  fullName: string;
  showMyEvents: boolean;
}

export function AccountSidebar({ fullName, showMyEvents }: Props) {
  const pathname = usePathname();
  const onProfile = pathname.startsWith("/account/profile");

  return (
    <aside className="w-full space-y-6 md:w-64 md:shrink-0">
      <div className="flex items-center gap-3">
        <DefaultAvatar size="sm" />
        <div className="min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">Tài khoản của</p>
          <p className="truncate font-display font-semibold">{fullName}</p>
        </div>
      </div>

      <nav className="space-y-1 text-sm">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 font-medium",
            onProfile ? "text-[#00b14f]" : "text-slate-600 dark:text-slate-300"
          )}
        >
          <UserRound size={18} /> Cài đặt tài khoản
        </div>
        <Link
          href="/account/profile"
          className={cn(
            "block rounded-xl py-2 pl-10 pr-3 transition-colors",
            onProfile
              ? "bg-[#00b14f]/10 font-medium text-[#00b14f]"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
          )}
        >
          Thông tin tài khoản
        </Link>
        <Link
          href="/my-tickets"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
        >
          <Ticket size={18} /> Vé của tôi
          <ChevronRight size={16} className="ml-auto text-slate-400" />
        </Link>
        {showMyEvents && (
          <Link
            href="/events"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <CalendarDays size={18} /> Sự kiện của tôi
          </Link>
        )}
      </nav>
    </aside>
  );
}

/** Default avatar — the project doesn't let users upload one yet. */
export function DefaultAvatar({ size = "lg" }: { size?: "sm" | "lg" }) {
  const big = size === "lg";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00b14f] to-emerald-700 text-white shadow-lg shadow-[#00b14f]/20",
        big ? "h-32 w-32 ring-4 ring-[#00b14f]/20" : "h-11 w-11"
      )}
      aria-hidden
    >
      <UserRound size={big ? 64 : 22} strokeWidth={1.75} />
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronDown, ChevronRight, Ticket, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  fullName: string;
  showMyEvents: boolean;
}

export function AccountSidebar({ fullName, showMyEvents }: Props) {
  const pathname = usePathname();
  const onProfile = pathname.startsWith("/account/profile");
  const onTickets = pathname.startsWith("/my-tickets");

  return (
    <aside className="w-full space-y-6 md:w-64 md:shrink-0">
      <Link href="/account/profile" className="group flex items-center gap-3">
        <DefaultAvatar size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">Tài khoản của</p>
          <p className="truncate font-display font-semibold">{fullName}</p>
        </div>
        <ChevronRight size={18} className="text-slate-400 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <nav className="space-y-1 text-sm">
        <NavGroup href="/account/profile" icon={<UserRound size={18} />} label="Cài đặt tài khoản" active={onProfile} />
        {onProfile && <NavChild href="/account/profile" active label="Thông tin tài khoản" />}

        <NavGroup href="/my-tickets" icon={<Ticket size={18} />} label="Đơn hàng của tôi" active={onTickets} />
        {onTickets && <NavChild href="/my-tickets" active label="Vé của tôi" />}

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

function NavGroup({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 font-medium transition-colors",
        active ? "text-[#00b14f]" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
      )}
    >
      {icon} {label}
      <ChevronDown size={16} className={cn("ml-auto transition-transform", !active && "-rotate-90 text-slate-400")} />
    </Link>
  );
}

function NavChild({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-xl py-2 pl-10 pr-3 transition-colors",
        active
          ? "bg-[#00b14f]/10 font-medium text-[#00b14f]"
          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
      )}
    >
      {label}
    </Link>
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

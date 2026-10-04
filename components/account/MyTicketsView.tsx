"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarDays, Clock, Globe, MapPin, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

type RegistrationStatus = "REGISTERED" | "CHECKED_IN" | "NO_SHOW" | "CANCELLED";

export interface MyTicket {
  id: string;
  ticket_code: string;
  status: RegistrationStatus;
  created_at: string;
  checked_in_at: string | null;
  events: {
    id: string;
    title: string;
    banner_url: string | null;
    location: string | null;
    is_online: boolean;
    start_date: string;
    end_date: string;
  } | null;
}

// Ticketbox's "Đang xử lý" has no equivalent here (registration is instant), so that slot shows no-shows.
const STATUS_TABS = [
  { key: "all", label: "Tất cả", match: () => true },
  { key: "success", label: "Thành công", match: (s: RegistrationStatus) => s === "REGISTERED" || s === "CHECKED_IN" },
  { key: "noshow", label: "Vắng mặt", match: (s: RegistrationStatus) => s === "NO_SHOW" },
  { key: "cancelled", label: "Đã hủy", match: (s: RegistrationStatus) => s === "CANCELLED" },
] as const;

const STATUS_BADGE: Record<RegistrationStatus, { label: string; className: string }> = {
  REGISTERED: { label: "Thành công", className: "bg-[#00b14f]/15 text-[#00b14f]" },
  CHECKED_IN: { label: "Đã check-in", className: "bg-sky-500/15 text-sky-500" },
  NO_SHOW: { label: "Vắng mặt", className: "bg-amber-500/15 text-amber-500" },
  CANCELLED: { label: "Đã hủy", className: "bg-rose-500/15 text-rose-500" },
};

export function MyTicketsView({ tickets }: { tickets: MyTicket[] }) {
  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]["key"]>("all");
  const [timeTab, setTimeTab] = useState<"upcoming" | "past">("upcoming");

  const visible = useMemo(() => {
    const now = Date.now();
    const match = STATUS_TABS.find((t) => t.key === statusTab)!.match;
    return tickets.filter((t) => {
      if (!t.events || !match(t.status)) return false;
      const ended = new Date(t.events.end_date).getTime() < now;
      return timeTab === "past" ? ended : !ended;
    });
  }, [tickets, statusTab, timeTab]);

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Trạng thái vé" className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            id={`ticket-status-${t.key}`}
            role="tab"
            aria-selected={statusTab === t.key}
            onClick={() => setStatusTab(t.key)}
            className={cn(
              "rounded-full py-2 text-sm font-semibold transition-all duration-200",
              statusTab === t.key
                ? "bg-[#00b14f] text-white shadow-lg shadow-[#00b14f]/25"
                : "bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-white/10 dark:text-slate-400 dark:hover:bg-white/15"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tablist" aria-label="Thời gian" className="flex justify-center gap-12">
        {([
          ["upcoming", "Sắp diễn ra"],
          ["past", "Đã kết thúc"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            id={`ticket-time-${key}`}
            role="tab"
            aria-selected={timeTab === key}
            onClick={() => setTimeTab(key)}
            className={cn(
              "relative pb-2 text-sm font-semibold transition-colors",
              timeTab === key ? "text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            {label}
            <span
              className={cn(
                "absolute inset-x-1/4 -bottom-0.5 h-0.5 rounded-full bg-[#00b14f] transition-transform duration-300",
                timeTab === key ? "scale-x-100" : "scale-x-0"
              )}
            />
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-4">
          {visible.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: MyTicket }) {
  const ev = ticket.events!;
  const start = new Date(ev.start_date);
  const badge = STATUS_BADGE[ticket.status];

  return (
    <li className="group flex overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00b14f]/40 hover:shadow-xl hover:shadow-[#00b14f]/10 dark:border-white/10 dark:bg-white/[0.03]">
      {/* Date stub */}
      <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-gradient-to-b from-[#00b14f] to-emerald-700 text-white">
        <span className="font-display text-3xl font-bold leading-none">{format(start, "dd")}</span>
        <span className="mt-1 text-xs uppercase tracking-wide">{format(start, "'Tháng' MM", { locale: vi })}</span>
        <span className="text-xs opacity-80">{format(start, "yyyy")}</span>
      </div>

      {/* Perforation */}
      <div className="relative w-0 border-l-2 border-dashed border-slate-200 dark:border-white/10">
        <span className="absolute -left-[9px] -top-2 h-4 w-4 rounded-full bg-[rgb(var(--bg))]" />
        <span className="absolute -bottom-2 -left-[9px] h-4 w-4 rounded-full bg-[rgb(var(--bg))]" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", badge.className)}>{badge.label}</span>
            <span className="font-mono text-xs text-slate-400">#{ticket.ticket_code}</span>
          </div>
          <h2 className="truncate font-display text-lg font-semibold transition-colors group-hover:text-[#00b14f]">
            {ev.title}
          </h2>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock size={14} /> {format(start, "HH:mm")} – {format(new Date(ev.end_date), "HH:mm, dd/MM/yyyy")}
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              {ev.is_online ? <Globe size={14} /> : <MapPin size={14} />}
              <span className="truncate">{ev.is_online ? "Trực tuyến" : ev.location ?? "Đang cập nhật"}</span>
            </span>
          </div>
        </div>

        <Link
          href={`/events/${ev.id}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#00b14f] px-4 py-2 text-sm font-semibold text-[#00b14f] transition-colors hover:bg-[#00b14f] hover:text-white"
        >
          <QrCode size={16} /> Xem vé
        </Link>
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="relative h-64 w-64 overflow-hidden rounded-full">
        {/* Source image has a margin around the circle — scale it so only the circle shows. */}
        <Image src="/images/empty-tickets.jpg" alt="" fill sizes="256px" className="scale-[1.33] object-cover" priority />
      </div>
      <p className="text-lg text-slate-500 dark:text-slate-400">Bạn chưa có vé nào</p>
      <Link
        href="/"
        id="browse-events-btn"
        className="inline-flex items-center gap-2 rounded-full bg-[#00b14f] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00b14f]/25 transition-all hover:-translate-y-0.5 hover:bg-[#009e47]"
      >
        <CalendarDays size={16} /> Khám phá sự kiện
      </Link>
    </div>
  );
}

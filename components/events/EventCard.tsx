"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, Users, Video, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateRange } from "@/lib/utils";
import type { EventWithOrganizer } from "@/lib/types/database.types";

const STATUS_TONE = {
  UPCOMING: "brand",
  ONGOING: "success",
  PAST: "neutral",
} as const;

export function EventCard({ event, index = 0, currentUserId, currentUserRole }: { event: EventWithOrganizer; index?: number; currentUserId?: string | null; currentUserRole?: string }) {
  const registered = event.registration_count ?? 0;
  const pctFull = Math.min(100, Math.round((registered / (event.max_capacity || 1)) * 100));
  
  const canEdit = (currentUserRole === "ADMIN" || (currentUserRole === "ORGANIZER" && event.created_by === currentUserId)) && event.status === "UPCOMING" && registered === 0;

  return (
    <div
      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
      className="group relative h-full animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-300"
    >
      <Link href={`/events/${event.id}`} className="block h-full">
        <div className="glass glass-hover relative flex h-full flex-col overflow-hidden rounded-2xl">
          <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-brand-indigo/30 to-brand-violet/30">
            {event.banner_url ? (
              <Image
                src={event.banner_url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 380px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-brand-gradient-radial">
                <CalendarDays className="text-white/70" size={32} />
              </div>
            )}
            <div className="absolute left-3 top-3">
              <Badge tone={STATUS_TONE[event.status]}>{event.status}</Badge>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 p-4">
            {event.category && (
              <span className="text-xs font-medium text-brand-indigo">{event.category}</span>
            )}
            <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug">
              {event.title}
            </h3>

            <div className="mt-auto space-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CalendarDays size={14} />
                <span>{formatDateRange(event.start_date, event.end_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                {event.is_online ? <Video size={14} /> : <MapPin size={14} />}
                <span className="truncate">{event.is_online ? "Online" : event.location ?? "TBA"}</span>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {registered}/{event.max_capacity}
                </span>
                <span>{pctFull}% full</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-brand-gradient transition-all"
                  style={{ width: `${pctFull}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
      {canEdit && (
        <Link 
          href={`/events/${event.id}/edit`} 
          className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium shadow-sm"
        >
          <Edit2 size={14} /> Sửa
        </Link>
      )}
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="skeleton h-40 w-full" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-1/3 rounded" />
        <div className="skeleton h-5 w-4/5 rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
      </div>
    </div>
  );
}

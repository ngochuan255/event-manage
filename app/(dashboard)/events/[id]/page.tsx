import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, ScanLine, Users, Video, Edit2 } from "lucide-react";
import { createClient, getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import { AgendaScheduler } from "@/components/agenda/AgendaScheduler";
import { RegisterButton } from "@/components/events/RegisterButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/utils";

export const revalidate = 0;

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Everything here only depends on params.id, so fire it all at once
  // instead of one round-trip after another.
  const [{ data: event }, { data: activities }, { count: registrationCount }, user, profile] =
    await Promise.all([
      supabase
        .from("events")
        .select("*, status, organizers(id, name, logo_url)")
        .eq("id", params.id)
        .single(),
      supabase.from("event_activities").select("*").eq("event_id", params.id),
      supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", params.id)
        .neq("status", "CANCELLED"),
      getCurrentUser(),
      getCurrentProfile(),
    ]);

  if (!event) notFound();

  const myRegistration = user
    ? (
        await supabase
          .from("event_registrations")
          .select("id, status")
          .eq("event_id", event.id)
          .eq("user_id", user.id)
          .maybeSingle()
      ).data
    : null;

  const canManage = profile?.role === "ADMIN" || profile?.role === "ORGANIZER";

  const registered = registrationCount ?? 0;
  const canEdit = (profile?.role === "ADMIN" || (profile?.role === "ORGANIZER" && event.created_by === user?.id)) && event.status === "UPCOMING" && registered === 0;

  return (
    <div className="space-y-6 py-6">
      <div className="group glass relative h-56 overflow-hidden rounded-2xl">
        {event.banner_url ? (
          <Image src={event.banner_url} alt="" fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-gradient-radial">
            <CalendarDays size={40} className="text-white/60" />
          </div>
        )}
        {canEdit && (
          <Link
            href={`/events/${event.id}/edit`}
            className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-sm backdrop-blur-md transition-opacity hover:bg-black/80 group-hover:opacity-100"
          >
            <Edit2 size={14} /> Sửa
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge tone={event.status === "ONGOING" ? "success" : "brand"}>{event.status}</Badge>
          <h1 className="mt-2 font-display text-3xl font-semibold">{event.title}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} /> {formatDateRange(event.start_date, event.end_date)}
            </span>
            <span className="flex items-center gap-1.5">
              {event.is_online ? <Video size={14} /> : <MapPin size={14} />}
              {event.is_online ? "Online" : event.location ?? "TBA"}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} /> {registrationCount ?? 0}/{event.max_capacity} registered
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <Link href={`/checkin/${event.id}`}>
              <Button variant="glass">
                <ScanLine size={16} /> Check-in scanner
              </Button>
            </Link>
          )}
          {canManage && (
            <Link href={`/analytics/${event.id}`}>
              <Button variant="glass">Live analytics</Button>
            </Link>
          )}
          {!canManage && (
            <RegisterButton
              eventId={event.id}
              isAuthenticated={!!user}
              registrationDeadline={event.registration_deadline}
              existingStatus={myRegistration?.status ?? null}
            />
          )}
        </div>
      </div>

      {event.description && (
        <Card className="p-5">
          <p className="whitespace-pre-line text-sm text-slate-300">{event.description}</p>
        </Card>
      )}

      <AgendaScheduler
        event={{ id: event.id, start_date: event.start_date, end_date: event.end_date }}
        initialActivities={activities ?? []}
        canEdit={canManage}
      />
    </div>
  );
}

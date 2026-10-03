import { createClient, getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import { BentoGrid } from "@/components/events/BentoGrid";
import type { EventWithOrganizer, EventStatus, Organizer } from "@/lib/types/database.types";

export const revalidate = 0;

type EventQueryRow = {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  category: string | null;
  location: string | null;
  is_online: boolean;
  online_url: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_capacity: number;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  organizers: Pick<Organizer, "id" | "name" | "logo_url"> | null;
  event_registrations: Array<{ count: number }>;
};

export default async function EventsPage({ searchParams }: { searchParams: { category?: string } }) {
  const supabase = await createClient();

  const [user, profile, { data: events, error }] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    supabase
      .from("events")
      .select("*, status, organizers(id, name, logo_url), event_registrations(count)")
      .order("start_date", { ascending: true }),
  ]);
  const currentUserId = user?.id ?? null;
  const currentUserRole = profile?.role ?? "ATTENDEE";

  if (error) {
    console.error("Failed to load events:", error.message);
  }

  const normalized: EventWithOrganizer[] = ((events ?? []) as unknown as EventQueryRow[]).map((e) => ({
    ...e,
    registration_count: e.event_registrations?.[0]?.count ?? 0,
  }));

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Events</h1>
          <p className="text-sm text-slate-400">Browse, filter, and manage upcoming events.</p>
        </div>
      </div>

      <BentoGrid events={normalized} initialCategory={searchParams.category} currentUserId={currentUserId} currentUserRole={currentUserRole} />
    </div>
  );
}

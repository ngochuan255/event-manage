import { notFound, redirect } from "next/navigation";
import { createClient, getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import { QRScanner } from "@/components/checkin/QRScanner";

export default async function CheckinPage({ params }: { params: { eventId: string } }) {
  const supabase = await createClient();
  const [user, profile, { data: event }] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    supabase.from("events").select("id, title").eq("id", params.eventId).single(),
  ]);
  if (!user) redirect(`/login?next=/checkin/${params.eventId}`);
  if (profile?.role !== "ADMIN" && profile?.role !== "ORGANIZER") redirect(`/events/${params.eventId}`);
  if (!event) notFound();

  return (
    <div className="space-y-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Check-in — {event.title}</h1>
        <p className="text-sm text-slate-400">Scan attendee tickets to mark them checked in.</p>
      </div>
      <QRScanner eventId={event.id} />
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { createClient, getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import { RealtimeAnalyticsDashboard } from "@/components/dashboard/RealtimeAnalyticsDashboard";

export default async function AnalyticsPage({ params }: { params: { eventId: string } }) {
  const supabase = await createClient();
  const [user, profile, { data: event }] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    supabase.from("events").select("id, title, max_capacity").eq("id", params.eventId).single(),
  ]);
  if (!user) redirect(`/login?next=/analytics/${params.eventId}`);
  if (profile?.role !== "ADMIN" && profile?.role !== "ORGANIZER") redirect(`/events/${params.eventId}`);
  if (!event) notFound();

  return (
    <div className="py-6">
      <RealtimeAnalyticsDashboard eventId={event.id} eventTitle={event.title} capacity={event.max_capacity} />
    </div>
  );
}

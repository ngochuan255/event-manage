import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyTicketToken } from "@/lib/qr/ticket";
import type { RegistrationStatus } from "@/lib/types/database.types";

export type CheckinResult =
  | { outcome: "SUCCESS"; attendeeName: string; eventTitle: string }
  | { outcome: "ALREADY_CHECKED_IN"; attendeeName: string; checkedInAt: string }
  | { outcome: "WRONG_EVENT"; attendeeName?: string }
  | { outcome: "INVALID"; reason: string };

/** Shape returned by the joined select on event_registrations. */
interface RegistrationWithJoins {
  id: string;
  status: RegistrationStatus;
  checked_in_at: string | null;
  user_id: string;
  event_id: string;
  profiles: { full_name: string } | null;
  events: { title: string } | null;
}

export async function POST(request: NextRequest) {
  const { token, eventId } = (await request.json()) as { token: string; eventId: string };

  // Confirm the scanning operator is an authenticated organizer/admin.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ outcome: "INVALID", reason: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "ADMIN" && profile.role !== "ORGANIZER")) {
    return NextResponse.json({ outcome: "INVALID", reason: "Not authorized to check in attendees" }, { status: 403 });
  }

  const verification = verifyTicketToken(token);
  if (!verification.valid) {
    return NextResponse.json<CheckinResult>({ outcome: "INVALID", reason: verification.reason });
  }

  if (verification.payload.eventId !== eventId) {
    return NextResponse.json<CheckinResult>({ outcome: "WRONG_EVENT" });
  }

  const admin = createAdminClient();
  const { data: registration, error: fetchError } = await admin
    .from("event_registrations")
    .select("id, status, checked_in_at, user_id, event_id, profiles(full_name), events(title)")
    .eq("id", verification.payload.registrationId)
    .eq("ticket_code", verification.payload.ticketCode)
    .single();

  if (fetchError || !registration) {
    return NextResponse.json<CheckinResult>({ outcome: "INVALID", reason: "Ticket not found" });
  }

  const reg = registration as unknown as RegistrationWithJoins;
  const attendeeName = reg.profiles?.full_name ?? "Attendee";
  const eventTitle = reg.events?.title ?? "Event";

  if (reg.status === "CHECKED_IN") {
    return NextResponse.json<CheckinResult>({
      outcome: "ALREADY_CHECKED_IN",
      attendeeName,
      checkedInAt: reg.checked_in_at ?? "",
    });
  }

  if (reg.status === "CANCELLED" || reg.status === "NO_SHOW") {
    return NextResponse.json<CheckinResult>({
      outcome: "INVALID",
      reason: `Registration is marked ${reg.status}`,
    });
  }

  const { error: updateError } = await admin
    .from("event_registrations")
    .update({ status: "CHECKED_IN", checked_in_at: new Date().toISOString(), checked_in_by: user.id })
    .eq("id", reg.id);

  if (updateError) {
    return NextResponse.json<CheckinResult>({ outcome: "INVALID", reason: updateError.message });
  }

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "CHECK_IN",
    target_entity: "event_registrations",
    target_id: reg.id,
    details: { event_id: eventId, attendee_id: reg.user_id },
  });

  return NextResponse.json<CheckinResult>({ outcome: "SUCCESS", attendeeName, eventTitle });
}

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { createTicketToken } from "@/lib/qr/ticket";

export async function POST(request: NextRequest) {
  const { eventId } = (await request.json()) as { eventId: string };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const ticketCode = randomUUID();

  // Capacity, deadline, and account-lock checks are re-enforced by the
  // `enforce_registration_rules` trigger — this insert is the single
  // source of truth, so a race between two requests still can't oversell.
  const { data: registration, error } = await supabase
    .from("event_registrations")
    .insert({ event_id: eventId, user_id: user.id, ticket_code: ticketCode })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const token = createTicketToken({ ticketCode, eventId, registrationId: registration.id });
  const qrDataUrl = await QRCode.toDataURL(token, { margin: 1, width: 320, color: { dark: "#0B0F17" } });

  // In production, kick off the Supabase Edge Function here (or via a DB
  // webhook on INSERT into event_registrations) to email the ticket —
  // see supabase/functions/send-ticket-email.

  return NextResponse.json({ registrationId: registration.id, qrDataUrl });
}

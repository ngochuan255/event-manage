// Supabase Edge Function: send-ticket-email
//
// Wire this up via Database Webhooks (Project Settings -> Database ->
// Webhooks) on INSERT into `event_registrations`, or call it directly from
// /api/tickets/generate right after the registration row is created.
//
// Deploy: supabase functions deploy send-ticket-email
// Secrets: supabase secrets set RESEND_API_KEY=... EMAIL_FROM=... TICKET_SIGNING_SECRET=...

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface WebhookPayload {
  record: {
    id: string;
    event_id: string;
    user_id: string;
    ticket_code: string;
  };
}

Deno.serve(async (req) => {
  try {
    const payload = (await req.json()) as WebhookPayload;
    const { id: registrationId, event_id: eventId, user_id: userId } = payload.record;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [{ data: profile }, { data: event }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", userId).single(),
      supabase.from("events").select("title, start_date, location").eq("id", eventId).single(),
    ]);

    if (!profile || !event) {
      return new Response(JSON.stringify({ error: "Registration context not found" }), { status: 404 });
    }

    // Look up the attendee's email via the auth admin API (not on `profiles`).
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const email = authUser.user?.email;
    if (!email) return new Response(JSON.stringify({ error: "No email on file" }), { status: 400 });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM"),
        to: email,
        subject: `Your ticket for ${event.title}`,
        html: `
          <p>Hi ${profile.full_name},</p>
          <p>You're registered for <strong>${event.title}</strong> on
             ${new Date(event.start_date).toLocaleString()}${event.location ? ` at ${event.location}` : ""}.</p>
          <p>Your QR ticket is available in your dashboard — bring it (digital or printed) to check in.</p>
          <p>Registration ID: ${registrationId}</p>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return new Response(JSON.stringify({ error: `Email provider error: ${body}` }), { status: 502 });
    }

    return new Response(JSON.stringify({ sent: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

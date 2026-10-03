# Pulse — Event Management & Real-Time Attendance Control

Next.js 14 (App Router, TypeScript) + Supabase (Postgres, Auth, Storage, Realtime), styled with
Tailwind CSS in a glassmorphism / bento-grid design system with dark and light themes.

## Stack

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion, Lucide icons,
  `html5-qrcode` for scanning, `qrcode` for generating ticket images, Recharts for the live
  check-in trend chart.
- **Backend**: Supabase Postgres with Row Level Security, Auth (email/password + Google/GitHub
  OAuth), Storage (event banners), Realtime (`postgres_changes` on `event_registrations` and
  `audit_logs`), and one example Edge Function for ticket emails.

## Getting started 

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
```

1. Create a Supabase project, then run the migrations in order (SQL editor or `supabase db push`):
   - `supabase/migrations/0001_init.sql` — schema, RLS policies, business-rule triggers
   - `supabase/migrations/0002_storage.sql` — public `event-assets` storage bucket
2. In Supabase Auth settings, enable the Google and GitHub providers if you want OAuth login, and
   add `http://localhost:3000/auth/callback` (and your prod URL) as a redirect URL.
3. `npm run dev` and open `http://localhost:3000`.

The first account you create is an `ATTENDEE` by default — promote it to `ADMIN` directly in the
`profiles` table to unlock the check-in scanner, live analytics, and admin pages.

### Deploying

Push to GitHub and import into Vercel. Set the same environment variables from `.env.local` in the
Vercel project settings (`SUPABASE_SERVICE_ROLE_KEY` as a server-only/secret variable). Deploy the
Edge Function separately with `supabase functions deploy send-ticket-email` and wire it to a
Database Webhook on `event_registrations` INSERT if you want automated confirmation emails.

## Directory structure

```
app/
  (auth)/login, (auth)/register        Auth pages + OAuth
  auth/callback                        OAuth code exchange route
  (dashboard)/layout.tsx               Sidebar shell for all authenticated pages
  (dashboard)/events                   List (BentoGrid), creation wizard, event detail
  (dashboard)/checkin/[eventId]        QR check-in scanner (organizer/admin)
  (dashboard)/analytics/[eventId]      Realtime analytics dashboard (organizer/admin)
  (dashboard)/admin/{audit-logs,users} Admin-only screens
  api/tickets/generate                 Registers an attendee, issues a signed QR ticket
  api/checkin                          Verifies a scanned ticket and marks attendance
components/
  ui/                                  Button, Card, Badge, Input primitives
  events/                              EventCard, BentoGrid, RegisterButton
  agenda/                              AgendaScheduler (conflict validation)
  checkin/                             QRScanner
  dashboard/                           RealtimeAnalyticsDashboard, AuditLogViewer, UserAdminTable
  theme/                               Dark/light ThemeProvider + toggle
lib/
  supabase/                            Browser, server, admin clients + middleware session refresh
  qr/ticket.ts                         HMAC sign/verify for QR payloads
  validations/agenda.ts                Client-side mirror of the DB conflict-check trigger
  types/database.types.ts              Hand-authored types matching the schema
supabase/
  migrations/                          Schema, RLS, triggers, storage bucket
  functions/send-ticket-email          Example Edge Function for confirmation emails
```

## Business rules and where they live

Every rule is enforced in Postgres (via triggers/RLS) so it holds regardless of which client calls
the database; the UI additionally mirrors the cheap ones for instant feedback.

| Rule | Enforced in |
|---|---|
| Activity time must fall within its event's window | `enforce_activity_rules()` trigger + `lib/validations/agenda.ts` |
| No two activities in the same room may overlap | `enforce_activity_rules()` trigger + `lib/validations/agenda.ts` |
| Can't delete an event with active registrations | `prevent_event_delete_with_registrations()` trigger |
| Can't register after the deadline or once at capacity | `enforce_registration_rules()` trigger |
| Locked accounts can't sign in or register | RLS (`current_user_is_locked()`) + trigger check |
| 3+ no-shows flags an account for lock review | `handle_no_show()` trigger → writes to `audit_logs` |
| QR tickets can't be forged or replayed at another event | `lib/qr/ticket.ts` (HMAC) + `/api/checkin` payload/event match |

## Notes and next steps

- `lib/types/database.types.ts` is hand-written to match the migration; once the project is linked,
  regenerate it for real with `supabase gen types typescript --linked`.
- The event creation wizard resolves an "organizer" by creating one on first use; a real deployment
  would add an organizer picker/CRUD screen (the `organizers` table and RLS already support it).
- Email delivery is stubbed as a Database Webhook → Edge Function; point it at any provider by
  swapping the `fetch` call in `supabase/functions/send-ticket-email`.

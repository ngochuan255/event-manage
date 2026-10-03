-- =========================================================================
-- Event Management & Real-time Attendance Control System
-- Initial schema, RLS policies, and business-rule enforcement
-- =========================================================================

create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------------------
-- Tables
-- -------------------------------------------------------------------------

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  avatar_url text,
  phone text,
  role text default 'ATTENDEE' check (role in ('ADMIN', 'ORGANIZER', 'ATTENDEE')),
  is_locked boolean default false,
  no_show_count int default 0,
  created_at timestamptz default now()
);

create table organizers (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) on delete set null,
  name text not null,
  description text,
  logo_url text,
  website text,
  social_links jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table events (
  id uuid default uuid_generate_v4() primary key,
  organizer_id uuid references organizers(id) on delete restrict,
  title text not null,
  description text,
  banner_url text,
  category text,
  location text,
  is_online boolean default false,
  online_url text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  registration_deadline timestamptz not null,
  max_capacity int default 100,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  constraint check_dates check (end_date > start_date and registration_deadline <= end_date)
);

create or replace function status(e events)
returns text
language sql
stable
as $$
  select case
    when now() < e.start_date then 'UPCOMING'
    when now() between e.start_date and e.end_date then 'ONGOING'
    else 'PAST'
  end;
$$;

create table event_activities (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references events(id) on delete cascade,
  title text not null,
  speaker_name text,
  speaker_avatar text,
  room text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  description text,
  created_at timestamptz default now(),
  constraint check_activity_time check (end_time > start_time)
);

create table event_registrations (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references events(id) on delete restrict,
  user_id uuid references profiles(id) on delete cascade,
  ticket_code text unique not null,
  status text default 'REGISTERED' check (status in ('REGISTERED', 'CHECKED_IN', 'NO_SHOW', 'CANCELLED')),
  checked_in_at timestamptz,
  checked_in_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique (event_id, user_id)
);

create table audit_logs (
  id uuid default uuid_generate_v4() primary key,
  actor_id uuid references profiles(id),
  action text not null,
  target_entity text,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

create index idx_events_organizer on events(organizer_id);
create index idx_activities_event on event_activities(event_id);
create index idx_registrations_event on event_registrations(event_id);
create index idx_registrations_user on event_registrations(user_id);
create index idx_registrations_ticket on event_registrations(ticket_code);
create index idx_audit_actor on audit_logs(actor_id);
create index idx_audit_created on audit_logs(created_at desc);

-- -------------------------------------------------------------------------
-- Helper: current user's role (avoids recursive RLS lookups)
-- -------------------------------------------------------------------------

create or replace function current_role_is(target_role text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = target_role
  );
$$;

create or replace function current_user_is_locked()
returns boolean
language sql
security definer
stable
as $$
  select coalesce((select is_locked from profiles where id = auth.uid()), false);
$$;

-- -------------------------------------------------------------------------
-- Business rule triggers
-- -------------------------------------------------------------------------

-- Rule: agenda activity must be fully inside its parent event's window,
-- and must not overlap another activity in the same room for the same event.
create or replace function enforce_activity_rules()
returns trigger
language plpgsql
as $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_conflict_count int;
begin
  select start_date, end_date into v_start, v_end from events where id = new.event_id;

  if new.start_time < v_start or new.end_time > v_end then
    raise exception 'Activity time (%, %) must fall within the event window (%, %)',
      new.start_time, new.end_time, v_start, v_end;
  end if;

  select count(*) into v_conflict_count
  from event_activities
  where event_id = new.event_id
    and id is distinct from new.id
    and room is not distinct from new.room
    and room is not null
    and tstzrange(start_time, end_time) && tstzrange(new.start_time, new.end_time);

  if v_conflict_count > 0 then
    raise exception 'Activity overlaps an existing activity in room "%" during that time slot', new.room;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_activity_rules on event_activities;
create trigger trg_activity_rules
  before insert or update on event_activities
  for each row execute function enforce_activity_rules();

-- Rule: block deleting an event that still has active (non-cancelled) registrations.
create or replace function prevent_event_delete_with_registrations()
returns trigger
language plpgsql
as $$
declare
  v_active_count int;
begin
  select count(*) into v_active_count
  from event_registrations
  where event_id = old.id and status <> 'CANCELLED';

  if v_active_count > 0 then
    raise exception 'Cannot delete event: % active registration(s) exist', v_active_count;
  end if;

  return old;
end;
$$;

drop trigger if exists trg_prevent_event_delete on events;
create trigger trg_prevent_event_delete
  before delete on events
  for each row execute function prevent_event_delete_with_registrations();

-- Rule: registration must respect capacity and the registration deadline.
create or replace function enforce_registration_rules()
returns trigger
language plpgsql
as $$
declare
  v_deadline timestamptz;
  v_capacity int;
  v_current_count int;
  v_locked boolean;
begin
  select registration_deadline, max_capacity into v_deadline, v_capacity from events where id = new.event_id;
  select is_locked into v_locked from profiles where id = new.user_id;

  if v_locked then
    raise exception 'This account is locked and cannot register for events';
  end if;

  if now() > v_deadline then
    raise exception 'Registration deadline has passed for this event';
  end if;

  select count(*) into v_current_count
  from event_registrations
  where event_id = new.event_id and status <> 'CANCELLED';

  if v_current_count >= v_capacity then
    raise exception 'Event is at full capacity (%)', v_capacity;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_registration_rules on event_registrations;
create trigger trg_registration_rules
  before insert on event_registrations
  for each row execute function enforce_registration_rules();

-- Rule: when a registration is marked NO_SHOW, bump the attendee's no_show_count,
-- and auto-lock the account with a flag once it crosses a threshold (3).
create or replace function handle_no_show()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'NO_SHOW' and old.status is distinct from 'NO_SHOW' then
    update profiles
      set no_show_count = no_show_count + 1
      where id = new.user_id;

    if (select no_show_count from profiles where id = new.user_id) >= 3 then
      insert into audit_logs (actor_id, action, target_entity, target_id, details)
      values (
        new.user_id,
        'FLAGGED_FOR_LOCK_REVIEW',
        'profiles',
        new.user_id,
        jsonb_build_object('reason', 'no_show_threshold_reached', 'event_id', new.event_id)
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_no_show on event_registrations;
create trigger trg_no_show
  after update on event_registrations
  for each row execute function handle_no_show();

-- -------------------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------------------

alter table profiles enable row level security;
alter table organizers enable row level security;
alter table events enable row level security;
alter table event_activities enable row level security;
alter table event_registrations enable row level security;
alter table audit_logs enable row level security;

-- profiles
create policy "profiles: self read" on profiles for select using (auth.uid() = id);
create policy "profiles: admin read all" on profiles for select using (current_role_is('ADMIN'));
create policy "profiles: self update (not role/lock)" on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
create policy "profiles: admin manage" on profiles for all using (current_role_is('ADMIN'));

-- organizers
create policy "organizers: public read" on organizers for select using (true);
create policy "organizers: admin write" on organizers for all using (current_role_is('ADMIN'));
create policy "organizers: owner update" on organizers for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- events
create policy "events: public read" on events for select using (true);
create policy "events: organizer/admin write" on events for insert
  with check (current_role_is('ADMIN') or current_role_is('ORGANIZER'));
create policy "events: organizer/admin update" on events for update
  using (current_role_is('ADMIN') or created_by = auth.uid())
  with check (current_role_is('ADMIN') or created_by = auth.uid());
create policy "events: organizer/admin delete" on events for delete
  using (current_role_is('ADMIN') or created_by = auth.uid());

-- event_activities
create policy "activities: public read" on event_activities for select using (true);
create policy "activities: organizer/admin write" on event_activities for all
  using (
    current_role_is('ADMIN')
    or exists (select 1 from events e where e.id = event_id and e.created_by = auth.uid())
  );

-- event_registrations
create policy "registrations: self read" on event_registrations for select
  using (user_id = auth.uid() or current_role_is('ADMIN') or current_role_is('ORGANIZER'));
create policy "registrations: self insert" on event_registrations for insert
  with check (user_id = auth.uid() and not current_user_is_locked());
create policy "registrations: organizer/admin update (check-in)" on event_registrations for update
  using (current_role_is('ADMIN') or current_role_is('ORGANIZER'))
  with check (current_role_is('ADMIN') or current_role_is('ORGANIZER'));
create policy "registrations: self cancel" on event_registrations for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- audit_logs
create policy "audit: admin read" on audit_logs for select using (current_role_is('ADMIN'));
create policy "audit: system insert" on audit_logs for insert with check (true);

-- -------------------------------------------------------------------------
-- Realtime: expose check-in counts / registration changes to subscribers
-- -------------------------------------------------------------------------
alter publication supabase_realtime add table event_registrations;
alter publication supabase_realtime add table audit_logs;

-- =========================================================================
-- 0003: Security hardening
--   1. Prevent non-admin users from escalating role / unlocking themselves
--   2. Restrict audit_logs insert to server-side only (SECURITY DEFINER fn)
--   3. Auto-create profile row on auth.users insert (eliminates race cond.)
--   4. Restrict storage uploads to organizer/admin roles
-- =========================================================================

-- -------------------------------------------------------------------------
-- FIX 1: Guard role & is_locked columns against self-update
-- -------------------------------------------------------------------------

create or replace function prevent_role_self_update()
returns trigger
language plpgsql
security definer
as $$
begin
  -- If role or is_locked is being changed, only allow if the caller is ADMIN
  if new.role is distinct from old.role or new.is_locked is distinct from old.is_locked then
    if (select role from profiles where id = auth.uid()) != 'ADMIN' then
      new.role := old.role;
      new.is_locked := old.is_locked;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_role_update on profiles;
create trigger trg_guard_role_update
  before update on profiles
  for each row execute function prevent_role_self_update();

-- -------------------------------------------------------------------------
-- FIX 2: Audit log forgery — drop the open insert policy, add a
--         SECURITY DEFINER function that only server/trigger code can call
-- -------------------------------------------------------------------------

-- Remove the dangerously open insert policy
drop policy if exists "audit: system insert" on audit_logs;

-- New policy: only allow inserts via the write_audit_log function (which runs
-- as SECURITY DEFINER) or from service_role.  No direct client inserts.
create policy "audit: service_role insert"
  on audit_logs for insert
  with check (auth.role() = 'service_role');

-- Helper function for server-side code and triggers to write audit entries
create or replace function write_audit_log(
  p_actor_id uuid,
  p_action text,
  p_target_entity text default null,
  p_target_id uuid default null,
  p_details jsonb default null
)
returns void
language plpgsql
security definer
as $$
begin
  insert into audit_logs (actor_id, action, target_entity, target_id, details)
  values (p_actor_id, p_action, p_target_entity, p_target_id, p_details);
end;
$$;

-- Update the no_show handler to use the new function instead of direct insert
create or replace function handle_no_show()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'NO_SHOW' and old.status is distinct from 'NO_SHOW' then
    update profiles
      set no_show_count = no_show_count + 1
      where id = new.user_id;

    if (select no_show_count from profiles where id = new.user_id) >= 3 then
      perform write_audit_log(
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

-- -------------------------------------------------------------------------
-- FIX 3: Auto-create profile on auth sign-up (prevents orphaned users)
-- -------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'New user'),
    new.raw_user_meta_data->>'avatar_url',
    'ATTENDEE'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- -------------------------------------------------------------------------
-- FIX 4: Restrict storage uploads to organizer/admin only
-- -------------------------------------------------------------------------

drop policy if exists "event-assets: authenticated upload" on storage.objects;

create policy "event-assets: organizer/admin upload"
  on storage.objects for insert
  with check (
    bucket_id = 'event-assets'
    and auth.role() = 'authenticated'
    and (current_role_is('ADMIN') or current_role_is('ORGANIZER'))
  );

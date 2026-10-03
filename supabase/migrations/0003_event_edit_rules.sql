-- Rule: block updating an event that has already started or has active registrations.
create or replace function prevent_invalid_event_updates()
returns trigger
language plpgsql
as $$
declare
  v_reg_count int;
begin
  -- Only check on updates that are actually changing fields we care about,
  -- but to be safe we block all updates except perhaps capacity extensions.
  -- For this requirement, any edit is blocked if event started or has registrations.
  
  -- If event has already started
  if old.start_date <= now() then
    raise exception 'Cannot edit an event that has already started or is in the past.';
  end if;

  -- Check if there are any active registrations
  select count(*) into v_reg_count
  from event_registrations
  where event_id = old.id and status <> 'CANCELLED';

  if v_reg_count > 0 then
    raise exception 'Cannot edit an event that already has registered attendees.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_invalid_event_update on events;
create trigger trg_prevent_invalid_event_update
  before update on events
  for each row execute function prevent_invalid_event_updates();

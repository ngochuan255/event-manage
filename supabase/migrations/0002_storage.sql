-- Public bucket for event banners and organizer logos.
insert into storage.buckets (id, name, public)
values ('event-assets', 'event-assets', true)
on conflict (id) do nothing;

drop policy if exists "event-assets: public read" on storage.objects;
create policy "event-assets: public read"
  on storage.objects for select
  using (bucket_id = 'event-assets');

drop policy if exists "event-assets: authenticated upload" on storage.objects;
create policy "event-assets: authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'event-assets' and auth.role() = 'authenticated');

drop policy if exists "event-assets: owner update/delete" on storage.objects;
create policy "event-assets: owner update/delete"
  on storage.objects for update using (bucket_id = 'event-assets' and owner = auth.uid());

drop policy if exists "event-assets: owner delete" on storage.objects;
create policy "event-assets: owner delete"
  on storage.objects for delete using (bucket_id = 'event-assets' and owner = auth.uid());

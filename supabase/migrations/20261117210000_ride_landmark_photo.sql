-- SheRides: passenger can send one photo of a nearby landmark for her ride.
--
--   * Private bucket "ride-landmarks". Path: <passenger id>/<ride id>/<file>.
--   * Only the passenger uploads, only while the ride is requested / accepted / in progress.
--   * Only the passenger, the assigned captain and admins can view it (short signed links).
--   * The latest photo is recorded on go_rides through go_set_landmark_photo (no direct updates).
--   * Safe to run more than once.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ride-landmarks', 'ride-landmarks', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.go_rides
  add column if not exists landmark_photo_path text,
  add column if not exists landmark_photo_at timestamptz;

drop policy if exists "Passenger uploads ride landmark photo" on storage.objects;
create policy "Passenger uploads ride landmark photo" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'ride-landmarks'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.go_rides r
      where r.id::text = (storage.foldername(name))[2]
        and r.passenger_id = (select auth.uid())
        and r.status in ('requested', 'accepted', 'in_progress')
    )
  );

drop policy if exists "Ride participants view landmark photo" on storage.objects;
create policy "Ride participants view landmark photo" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'ride-landmarks'
    and (
      public.is_admin()
      or exists (
        select 1 from public.go_rides r
        where r.id::text = (storage.foldername(name))[2]
          and ((select auth.uid()) = r.passenger_id or (select auth.uid()) = r.rider_id)
      )
    )
  );

create or replace function public.go_set_landmark_photo(p_ride_id uuid, p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  r public.go_rides;
begin
  if me is null then raise exception 'Sign in first'; end if;
  select * into r from public.go_rides where id = p_ride_id;
  if not found or r.passenger_id <> me then raise exception 'Ride not found'; end if;
  if r.status not in ('requested', 'accepted', 'in_progress') then
    raise exception 'Landmark photos can be sent only while the ride is active';
  end if;
  if p_path is null or left(p_path, length(me::text || '/' || p_ride_id::text || '/'))
       <> me::text || '/' || p_ride_id::text || '/' then
    raise exception 'Invalid photo upload';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'ride-landmarks' and name = p_path) then
    raise exception 'Photo upload not found';
  end if;

  update public.go_rides
     set landmark_photo_path = p_path, landmark_photo_at = now()
   where id = p_ride_id;

  if r.rider_id is not null then
    perform public.notify_member(r.rider_id, me, 'go_message', 'Passenger sent a landmark photo', '/go/ride/' || p_ride_id);
  end if;
end;
$$;
revoke all on function public.go_set_landmark_photo(uuid, text) from public, anon;
grant execute on function public.go_set_landmark_photo(uuid, text) to authenticated;

notify pgrst, 'reload schema';

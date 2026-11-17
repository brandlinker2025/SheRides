-- Manual and rider-initiated assignments take the same per-rider lock.
create or replace function public.go_accept_ride(p_ride_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  r public.go_rides;
begin
  if me is null or not public.go_rider_is_approved(me) then
    if exists (
      select 1 from public.go_applications
      where user_id = me and role = 'rider' and status = 'pending'
    ) then
      raise exception 'Waiting for admin approval. You cannot accept rides yet';
    end if;
    raise exception 'Only approved SheRides riders can accept rides';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(me::text, 0));
  select * into r from public.go_rides where id = p_ride_id for update;
  if not found then raise exception 'Ride not found'; end if;
  if r.passenger_id = me then raise exception 'You cannot accept your own ride'; end if;
  if r.status <> 'requested' or r.rider_id is not null then
    raise exception 'This ride was already taken or cancelled';
  end if;
  if r.kind = 'now' and exists (
    select 1 from public.go_rides
    where rider_id = me and status in ('accepted', 'in_progress') and kind = 'now'
  ) then
    raise exception 'Finish your current ride first';
  end if;

  update public.go_rides
  set rider_id = me, status = 'accepted', accepted_at = now()
  where id = p_ride_id;

  perform public.notify_member(
    r.passenger_id, me, 'go_accepted', 'Your SheRides rider is confirmed', '/go/ride/' || p_ride_id
  );
end;
$$;

revoke all on function public.go_accept_ride(uuid) from public, anon;
grant execute on function public.go_accept_ride(uuid) to authenticated;

create or replace function public.go_admin_assign_ride(p_ride_id uuid, p_rider_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_id uuid := (select auth.uid());
  ride public.go_rides;
begin
  if admin_id is null or not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_rider_id is null then raise exception 'Select an approved captain'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_rider_id::text, 0));
  if not public.go_rider_is_approved(p_rider_id) then
    raise exception 'Select an approved captain';
  end if;

  select * into ride from public.go_rides where id = p_ride_id for update;
  if not found then raise exception 'Ride not found'; end if;
  if ride.status <> 'requested' or ride.rider_id is not null then
    raise exception 'This ride was already taken or cancelled';
  end if;
  if ride.passenger_id = p_rider_id then
    raise exception 'The captain cannot be the passenger';
  end if;
  if ride.kind = 'now' and exists (
    select 1 from public.go_rides where rider_id = p_rider_id
      and status in ('accepted', 'in_progress') and kind = 'now'
  ) then
    raise exception 'The captain already has an active ride';
  end if;

  update public.go_rides set rider_id = p_rider_id, status = 'accepted', accepted_at = now()
  where id = p_ride_id;

  perform public.notify_member(
    ride.passenger_id, p_rider_id, 'go_accepted', 'Your SheRides rider is confirmed', '/go/ride/' || p_ride_id
  );
  perform public.notify_member(
    p_rider_id, admin_id, 'go_accepted', 'SheRides assigned you a ride', '/go/ride/' || p_ride_id
  );
end;
$$;

revoke all on function public.go_admin_assign_ride(uuid, uuid) from public, anon;
grant execute on function public.go_admin_assign_ride(uuid, uuid) to authenticated;

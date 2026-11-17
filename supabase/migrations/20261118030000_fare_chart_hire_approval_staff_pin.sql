-- SheRides, 18 Nov 2026 (owner's final fare chart and policy)
--
-- 1. Fares (server is the source of truth; the app shows the same numbers)
--      Live ride (now):   ৳30 per km, flat
--      Pre-booking:       up to 2 km ৳100, 3 km ৳120, 4 km ৳150, 5 km ৳180, 6 km ৳210, then +৳20 per km
--      Hire:              ৳300 per hour (extra km ৳15 each, set by staff)
--    Waiting (shown to riders): live ৳2/min; pre-booking and hire ৳1.50/min.
-- 2. Hire rides are never confirmed automatically: captains are not notified and cannot accept
--    them. Admins and moderators get a notification, set the final fare and assign a captain.
-- 3. Staff short links with a PIN: sherides.online/rs/<name> + a 6-digit PIN once per device.
--    Only a hash of the PIN is stored; 8 wrong tries lock it until an admin sets a new one.
-- Safe to run more than once.

-- 1. Fares ---------------------------------------------------------------------------------
create or replace function public.sr_fare(p_kind text, p_distance_km numeric, p_hire_hours integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_kind = 'hire' then 300 * greatest(1, coalesce(p_hire_hours, 1))
    when p_kind = 'scheduled' then
      case
        when ceil(coalesce(p_distance_km, 0)) <= 2 then 100
        when ceil(p_distance_km) = 3 then 120
        when ceil(p_distance_km) = 4 then 150
        when ceil(p_distance_km) = 5 then 180
        when ceil(p_distance_km) = 6 then 210
        else 210 + 20 * (ceil(p_distance_km)::integer - 6)
      end
    else greatest(30, round(30 * coalesce(p_distance_km, 0))::integer)
  end;
$$;
grant execute on function public.sr_fare(text, numeric, integer) to authenticated;

create or replace function public.go_service_fare(p_service text, p_kind text, p_distance_km numeric, p_hire_hours integer)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select public.sr_fare(p_kind, p_distance_km, p_hire_hours);
$$;
revoke all on function public.go_service_fare(text, text, numeric, integer) from public, anon;
grant execute on function public.go_service_fare(text, text, numeric, integer) to authenticated;

create or replace function public.go_fare(p_kind text, p_distance_km numeric, p_hire_hours integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select public.sr_fare(p_kind, p_distance_km, p_hire_hours);
$$;

-- 2. Hire needs staff ------------------------------------------------------------------------
-- Captains are not notified about hire requests (the live request function is rewritten in place).
do $$
declare
  f record;
  def text;
  fixed text;
begin
  for f in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'go_request_ride'
  loop
    def := pg_get_functiondef(f.oid);
    if position('p_kind <> ''hire'' and (' in def) = 0 then
      fixed := replace(def, E'and (\n        p_kind <> ''now''', E'and p_kind <> ''hire'' and (\n        p_kind <> ''now''');
      if fixed <> def then
        execute fixed;
      else
        raise notice 'go_request_ride: captain notification filter not found; hire is still blocked by the trigger below';
      end if;
    end if;
  end loop;
end;
$$;

-- Only staff can put a captain on a hire ride; staff hear about every new hire request.
create or replace function public.go_hire_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'hire' and old.rider_id is null and new.rider_id is not null and not public.is_staff() then
    raise exception 'Hire rides are confirmed by the SheRides admin team';
  end if;
  return new;
end;
$$;
drop trigger if exists go_hire_guard on public.go_rides;
create trigger go_hire_guard before update on public.go_rides
  for each row execute function public.go_hire_guard();

create or replace function public.go_hire_notify_staff()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  staff record;
begin
  if new.kind = 'hire' then
    for staff in select id from public.profiles where role in ('admin', 'moderator') loop
      perform public.notify_member(staff.id, new.passenger_id, 'go_message', 'New hire request: set the fare and a captain', '/admin/go');
    end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists go_hire_notify_staff on public.go_rides;
create trigger go_hire_notify_staff after insert on public.go_rides
  for each row execute function public.go_hire_notify_staff();

-- Staff set the final fare of a ride that has not started (hire hours, extra km).
create or replace function public.go_admin_set_fare(p_ride_id uuid, p_fare integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.go_rides;
begin
  if not public.is_staff() then raise exception 'Administrator access required'; end if;
  if p_fare is null or p_fare < 0 or p_fare > 50000 then raise exception 'Fare must be between ৳0 and ৳50,000'; end if;
  select * into r from public.go_rides where id = p_ride_id for update;
  if not found then raise exception 'Ride not found'; end if;
  if r.status not in ('requested', 'accepted') then raise exception 'The fare can only change before the ride starts'; end if;
  update public.go_rides set fare = p_fare where id = p_ride_id;
  perform public.notify_member(r.passenger_id, (select auth.uid()), 'go_message', 'Your SheRides fare is set: ৳' || p_fare, '/go/ride/' || p_ride_id);
end;
$$;
revoke all on function public.go_admin_set_fare(uuid, integer) from public, anon;
grant execute on function public.go_admin_set_fare(uuid, integer) to authenticated;

-- 3. Staff short link + PIN ------------------------------------------------------------------
alter table public.staff_access_links add column if not exists kind text not null default 'link';
alter table public.staff_access_links add column if not exists slug text;
alter table public.staff_access_links add column if not exists fail_count integer not null default 0;
alter table public.staff_access_links drop constraint if exists staff_access_links_kind_check;
alter table public.staff_access_links add constraint staff_access_links_kind_check check (kind in ('link', 'pin'));
alter table public.staff_access_links drop constraint if exists staff_access_links_slug_check;
alter table public.staff_access_links add constraint staff_access_links_slug_check check (slug is null or slug ~ '^[a-z0-9-]{3,30}$');
create unique index if not exists staff_access_links_active_slug on public.staff_access_links (slug) where revoked_at is null and kind = 'pin';

notify pgrst, 'reload schema';

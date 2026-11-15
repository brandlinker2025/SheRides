-- Vehicle label for a ride request. Every category uses the same distance slab.
-- Up to 5 km: ৳30/km (5 km = ৳150). Each km after that: ৳18. No car, CNG, or tier multiplier.
-- Waiting time (৳1.50/min) is not stored here; it is shown on the booking screen and
-- applies only while a ride is paused, delayed, or waiting at pickup.
-- The original go_request_ride signature stays so older clients still book.

alter table public.go_rides
  add column if not exists service text not null default 'ev_bike';

alter table public.go_rides drop constraint if exists go_rides_service_check;
alter table public.go_rides
  add constraint go_rides_service_check check (service in ('ev_bike', 'racing_bike', 'moto_155', 'scooter_light'));

create or replace function public.go_fare(p_kind text, p_distance_km numeric, p_hire_hours integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_kind = 'hire' then 250 * greatest(1, coalesce(p_hire_hours, 1))
    else round((
      case
        when coalesce(p_distance_km, 0) <= 5 then 30 * coalesce(p_distance_km, 0)
        else 150 + 18 * (coalesce(p_distance_km, 0) - 5)
      end
    )::numeric)::integer
  end;
$$;

create or replace function public.go_service_fare(
  p_service text,
  p_kind text,
  p_distance_km numeric,
  p_hire_hours integer
)
returns integer
language sql
immutable
set search_path = ''
as $$
  -- p_service is recorded on the ride. It does not change the amount.
  select public.go_fare(p_kind, p_distance_km, p_hire_hours);
$$;

revoke all on function public.go_service_fare(text, text, numeric, integer) from public, anon;
grant execute on function public.go_service_fare(text, text, numeric, integer) to authenticated;

create or replace function public.go_request_ride(
  p_kind text,
  p_pickup_text text,
  p_pickup_lat double precision,
  p_pickup_lng double precision,
  p_drop_text text,
  p_drop_lat double precision,
  p_drop_lng double precision,
  p_scheduled_at timestamptz,
  p_hire_hours integer,
  p_payment text,
  p_note text,
  p_service text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  km numeric;
  new_id uuid;
  rider record;
  notified integer := 0;
  chosen text := case
    when lower(coalesce(p_service, '')) in ('ev_bike', 'racing_bike', 'moto_155', 'scooter_light') then lower(p_service)
    else 'ev_bike'
  end;
begin
  if me is null or not public.go_is_approved('passenger') then
    raise exception 'Your SheRides passenger verification must be approved first';
  end if;
  if p_kind not in ('now', 'scheduled', 'hire') then raise exception 'Invalid ride type'; end if;
  if exists (
    select 1 from public.go_rides
    where passenger_id = me and kind = 'now' and status in ('requested', 'accepted', 'in_progress')
  ) and p_kind = 'now' then
    raise exception 'You already have an active ride';
  end if;
  if p_kind in ('scheduled', 'hire') and p_scheduled_at is not null
     and (p_scheduled_at < now() + interval '15 minutes' or p_scheduled_at > now() + interval '30 days') then
    raise exception 'Choose a time between 15 minutes and 30 days from now';
  end if;
  if p_kind = 'scheduled' and p_scheduled_at is null then raise exception 'Choose a pickup time'; end if;
  if p_kind <> 'hire' and (p_drop_lat is null or p_drop_lng is null or p_pickup_lat is null or p_pickup_lng is null) then
    raise exception 'Choose pickup and drop-off from the suggestions so the fare can be calculated';
  end if;
  if p_kind = 'hire' and (p_hire_hours is null or p_hire_hours < 1 or p_hire_hours > 12) then
    raise exception 'Hire time must be 1 to 12 hours';
  end if;

  if p_kind <> 'hire' then
    km := public.go_distance_km(p_pickup_lat, p_pickup_lng, p_drop_lat, p_drop_lng);
    if km > 120 then raise exception 'Trips longer than 120 km are not supported yet'; end if;
  end if;

  insert into public.go_rides (
    passenger_id, kind, service, pickup_text, pickup_lat, pickup_lng, drop_text, drop_lat, drop_lng,
    distance_km, hire_hours, scheduled_at, fare, payment_method, note
  ) values (
    me, p_kind, chosen, btrim(p_pickup_text), p_pickup_lat, p_pickup_lng, nullif(btrim(p_drop_text), ''),
    p_drop_lat, p_drop_lng, km, case when p_kind = 'hire' then p_hire_hours end,
    case when p_kind = 'now' then null else p_scheduled_at end,
    public.go_service_fare(chosen, p_kind, km, p_hire_hours),
    case when p_payment in ('cash', 'bkash', 'nagad') then p_payment else 'cash' end,
    nullif(btrim(left(coalesce(p_note, ''), 300)), '')
  ) returning id into new_id;

  insert into public.go_ride_secrets (ride_id, passenger_id, pin)
  values (new_id, me, lpad((floor(random() * 10000))::int::text, 4, '0'));

  for rider in
    select a.user_id
    from public.go_applications a
    left join public.go_rider_state s on s.user_id = a.user_id
    where a.role = 'rider' and a.status = 'approved' and a.user_id <> me
      and (
        p_kind <> 'now'
        or (s.is_online and s.updated_at > now() - interval '10 minutes'
            and (s.lat is null or public.go_distance_km(s.lat, s.lng, p_pickup_lat, p_pickup_lng) <= 8))
      )
    limit 40
  loop
    perform public.notify_member(
      rider.user_id, me, 'go_request',
      case p_kind when 'now' then 'New SheRides ride request near you'
                  when 'hire' then 'New hire request on SheRides'
                  else 'New pre-booked ride on SheRides' end,
      '/go?tab=rider'
    );
    notified := notified + 1;
  end loop;

  return new_id;
end;
$$;

revoke all on function public.go_request_ride(text, text, double precision, double precision, text, double precision, double precision, timestamptz, integer, text, text, text) from public, anon;
grant execute on function public.go_request_ride(text, text, double precision, double precision, text, double precision, double precision, timestamptz, integer, text, text, text) to authenticated;

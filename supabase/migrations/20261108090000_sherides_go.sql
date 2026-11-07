-- SheRides Go: women-only ride booking (instant, pre-book, hire) inside SheRides.
--
-- Security model
--   * Only admin-approved SheRides members can use Go at all.
--   * Every passenger AND every rider submits NID + a live selfie (riders also licence +
--     bike papers). An administrator compares face, name and NID before approving.
--   * All state changes go through SECURITY DEFINER functions below; tables have no
--     direct insert/update grants for members.
--   * The ride PIN lives in go_ride_secrets, readable only by the passenger, so the rider
--     cannot start a ride without the passenger physically telling her the PIN.
--   * Documents use the existing private `verifications` bucket (owner/admin only).

-- ---------------------------------------------------------------------------
-- Applications (passenger access + rider access)
-- ---------------------------------------------------------------------------
create table if not exists public.go_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('passenger', 'rider')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  full_name text not null check (char_length(full_name) between 2 and 80),
  nid_number text not null check (nid_number ~ '^[0-9]{10,17}$'),
  emergency_contact_name text check (char_length(emergency_contact_name) <= 80),
  emergency_contact_phone text check (emergency_contact_phone ~ '^(\+?88)?01[3-9][0-9]{8}$'),
  nid_front_path text not null,
  nid_back_path text,
  selfie_path text not null,
  license_number text check (char_length(license_number) <= 40),
  license_path text,
  bike_model text check (char_length(bike_model) <= 60),
  bike_plate text check (char_length(bike_plate) <= 30),
  bike_papers_path text,
  declared_female boolean not null default false,
  admin_notes text check (char_length(admin_notes) <= 500),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role),
  constraint go_rider_docs check (
    role = 'passenger'
    or (license_number is not null and license_path is not null and bike_model is not null
        and bike_plate is not null and bike_papers_path is not null)
  ),
  constraint go_declared_female check (declared_female)
);

alter table public.go_applications enable row level security;

drop policy if exists "Go applicants read own" on public.go_applications;
create policy "Go applicants read own" on public.go_applications
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- ---------------------------------------------------------------------------
-- Rider live state
-- ---------------------------------------------------------------------------
create table if not exists public.go_rider_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  is_online boolean not null default false,
  lat double precision,
  lng double precision,
  updated_at timestamptz not null default now(),
  rating_sum integer not null default 0,
  rating_count integer not null default 0,
  completed_rides integer not null default 0
);

alter table public.go_rider_state enable row level security;

drop policy if exists "Go rider state readable by members" on public.go_rider_state;
create policy "Go rider state readable by members" on public.go_rider_state
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- ---------------------------------------------------------------------------
-- Rides
-- ---------------------------------------------------------------------------
create table if not exists public.go_rides (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  rider_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('now', 'scheduled', 'hire')),
  status text not null default 'requested'
    check (status in ('requested', 'accepted', 'in_progress', 'completed', 'cancelled')),
  pickup_text text not null check (char_length(pickup_text) between 2 and 200),
  pickup_lat double precision,
  pickup_lng double precision,
  drop_text text check (char_length(drop_text) <= 200),
  drop_lat double precision,
  drop_lng double precision,
  distance_km numeric(6, 2),
  hire_hours integer check (hire_hours between 1 and 12),
  scheduled_at timestamptz,
  fare integer not null check (fare between 0 and 50000),
  payment_method text not null default 'cash' check (payment_method in ('cash', 'bkash', 'nagad')),
  note text check (char_length(note) <= 300),
  rider_lat double precision,
  rider_lng double precision,
  rider_seen_at timestamptz,
  passenger_rating integer check (passenger_rating between 1 and 5),
  rider_rating integer check (rider_rating between 1 and 5),
  passenger_feedback text check (char_length(passenger_feedback) <= 500),
  rider_feedback text check (char_length(rider_feedback) <= 500),
  cancelled_by uuid references public.profiles(id),
  cancel_reason text check (char_length(cancel_reason) <= 200),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists go_rides_status_idx on public.go_rides (status, created_at desc);
create index if not exists go_rides_passenger_idx on public.go_rides (passenger_id, created_at desc);
create index if not exists go_rides_rider_idx on public.go_rides (rider_id, created_at desc);

alter table public.go_rides enable row level security;

create or replace function public.go_is_approved(target_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.go_applications a
    join public.profiles p on p.id = a.user_id
    where a.user_id = (select auth.uid())
      and a.role = target_role
      and a.status = 'approved'
      and (p.verified = true or p.role = 'admin')
  );
$$;
revoke all on function public.go_is_approved(text) from public, anon;
grant execute on function public.go_is_approved(text) to authenticated;

drop policy if exists "Go rides visible to participants" on public.go_rides;
create policy "Go rides visible to participants" on public.go_rides
  for select to authenticated
  using (
    passenger_id = (select auth.uid())
    or rider_id = (select auth.uid())
    or public.is_admin()
    or (status = 'requested' and rider_id is null and public.go_is_approved('rider'))
  );

-- Secrets: ride PIN and the public trip-share token. Passenger (and admin) only.
create table if not exists public.go_ride_secrets (
  ride_id uuid primary key references public.go_rides(id) on delete cascade,
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  pin text not null check (pin ~ '^[0-9]{4}$'),
  share_token uuid not null unique default gen_random_uuid()
);

alter table public.go_ride_secrets enable row level security;

drop policy if exists "Go secrets for passenger" on public.go_ride_secrets;
create policy "Go secrets for passenger" on public.go_ride_secrets
  for select to authenticated
  using (passenger_id = (select auth.uid()) or public.is_admin());

-- Realtime so both sides see status changes instantly.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'go_rides'
  ) then
    alter publication supabase_realtime add table public.go_rides;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Fare (single source of truth; the browser only shows an estimate)
-- ---------------------------------------------------------------------------
create or replace function public.go_fare(p_kind text, p_distance_km numeric, p_hire_hours integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_kind = 'hire' then 250 * greatest(1, coalesce(p_hire_hours, 1))
    else greatest(70, round(30 + 14 * coalesce(p_distance_km, 0)))::integer
  end;
$$;
grant execute on function public.go_fare(text, numeric, integer) to authenticated;

create or replace function public.go_distance_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns numeric
language sql
immutable
set search_path = ''
as $$
  -- Straight-line distance x 1.3 to approximate Dhaka road distance.
  select round((2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  )) * 1.3)::numeric, 2);
$$;

-- ---------------------------------------------------------------------------
-- Member actions
-- ---------------------------------------------------------------------------
create or replace function public.go_submit_application(
  p_role text,
  p_full_name text,
  p_nid_number text,
  p_emergency_name text,
  p_emergency_phone text,
  p_nid_front_path text,
  p_nid_back_path text,
  p_selfie_path text,
  p_license_number text,
  p_license_path text,
  p_bike_model text,
  p_bike_plate text,
  p_bike_papers_path text,
  p_declared_female boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  existing public.go_applications;
  app_id uuid;
  prefix text;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if not exists (select 1 from public.profiles where id = me and (verified = true or role = 'admin')) then
    raise exception 'Your SheRides membership must be approved first';
  end if;
  if p_role not in ('passenger', 'rider') then raise exception 'Invalid role'; end if;
  if coalesce(p_declared_female, false) is not true then
    raise exception 'SheRides Go is for women only';
  end if;

  -- Every document must be inside the applicant's own private folder.
  prefix := me::text || '/go/';
  if left(p_nid_front_path, length(prefix)) <> prefix
     or left(p_selfie_path, length(prefix)) <> prefix
     or (p_nid_back_path is not null and left(p_nid_back_path, length(prefix)) <> prefix)
     or (p_license_path is not null and left(p_license_path, length(prefix)) <> prefix)
     or (p_bike_papers_path is not null and left(p_bike_papers_path, length(prefix)) <> prefix) then
    raise exception 'Invalid document upload';
  end if;

  select * into existing from public.go_applications where user_id = me and role = p_role;
  if found and existing.status in ('pending', 'approved') then
    raise exception 'You already have a % application (%).', p_role, existing.status;
  end if;
  if found and existing.status = 'suspended' then
    raise exception 'This account is suspended from SheRides Go. Contact an admin.';
  end if;

  insert into public.go_applications as a (
    user_id, role, status, full_name, nid_number, emergency_contact_name, emergency_contact_phone,
    nid_front_path, nid_back_path, selfie_path, license_number, license_path,
    bike_model, bike_plate, bike_papers_path, declared_female, admin_notes, reviewed_by, reviewed_at
  ) values (
    me, p_role, 'pending', btrim(p_full_name), p_nid_number, nullif(btrim(p_emergency_name), ''),
    nullif(btrim(p_emergency_phone), ''), p_nid_front_path, p_nid_back_path, p_selfie_path,
    nullif(btrim(p_license_number), ''), p_license_path, nullif(btrim(p_bike_model), ''),
    nullif(upper(btrim(p_bike_plate)), ''), p_bike_papers_path, true, null, null, null
  )
  on conflict (user_id, role) do update set
    status = 'pending', full_name = excluded.full_name, nid_number = excluded.nid_number,
    emergency_contact_name = excluded.emergency_contact_name,
    emergency_contact_phone = excluded.emergency_contact_phone,
    nid_front_path = excluded.nid_front_path, nid_back_path = excluded.nid_back_path,
    selfie_path = excluded.selfie_path, license_number = excluded.license_number,
    license_path = excluded.license_path, bike_model = excluded.bike_model,
    bike_plate = excluded.bike_plate, bike_papers_path = excluded.bike_papers_path,
    declared_female = true, admin_notes = null, reviewed_by = null, reviewed_at = null,
    updated_at = now()
  returning a.id into app_id;

  return app_id;
end;
$$;
revoke all on function public.go_submit_application(text, text, text, text, text, text, text, text, text, text, text, text, text, boolean) from public, anon;
grant execute on function public.go_submit_application(text, text, text, text, text, text, text, text, text, text, text, text, text, boolean) to authenticated;

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
  p_note text
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
begin
  if me is null or not public.go_is_approved('passenger') then
    raise exception 'Your SheRides Go passenger verification must be approved first';
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
    passenger_id, kind, pickup_text, pickup_lat, pickup_lng, drop_text, drop_lat, drop_lng,
    distance_km, hire_hours, scheduled_at, fare, payment_method, note
  ) values (
    me, p_kind, btrim(p_pickup_text), p_pickup_lat, p_pickup_lng, nullif(btrim(p_drop_text), ''),
    p_drop_lat, p_drop_lng, km, case when p_kind = 'hire' then p_hire_hours end,
    case when p_kind = 'now' then null else p_scheduled_at end,
    public.go_fare(p_kind, km, p_hire_hours),
    case when p_payment in ('cash', 'bkash', 'nagad') then p_payment else 'cash' end,
    nullif(btrim(left(coalesce(p_note, ''), 300)), '')
  ) returning id into new_id;

  insert into public.go_ride_secrets (ride_id, passenger_id, pin)
  values (new_id, me, lpad((floor(random() * 10000))::int::text, 4, '0'));

  -- Tell approved riders: nearby online riders first for instant rides, everyone for bookings.
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
      case p_kind when 'now' then 'New SheRides Go ride request near you'
                  when 'hire' then 'New hire request on SheRides Go'
                  else 'New pre-booked ride on SheRides Go' end,
      '/go?tab=rider'
    );
    notified := notified + 1;
  end loop;

  return new_id;
end;
$$;
revoke all on function public.go_request_ride(text, text, double precision, double precision, text, double precision, double precision, timestamptz, integer, text, text) from public, anon;
grant execute on function public.go_request_ride(text, text, double precision, double precision, text, double precision, double precision, timestamptz, integer, text, text) to authenticated;

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
  if me is null or not public.go_is_approved('rider') then raise exception 'Only approved SheRides Go riders can accept rides'; end if;
  select * into r from public.go_rides where id = p_ride_id for update;
  if not found then raise exception 'Ride not found'; end if;
  if r.passenger_id = me then raise exception 'You cannot accept your own ride'; end if;
  if r.status <> 'requested' or r.rider_id is not null then raise exception 'This ride was already taken or cancelled'; end if;
  if r.kind = 'now' and exists (
    select 1 from public.go_rides where rider_id = me and status in ('accepted', 'in_progress') and kind = 'now'
  ) then
    raise exception 'Finish your current ride first';
  end if;

  update public.go_rides set rider_id = me, status = 'accepted', accepted_at = now() where id = p_ride_id;
  perform public.notify_member(r.passenger_id, me, 'go_accepted', 'Your SheRides Go rider is confirmed', '/go/ride/' || p_ride_id);
end;
$$;
revoke all on function public.go_accept_ride(uuid) from public, anon;
grant execute on function public.go_accept_ride(uuid) to authenticated;

create or replace function public.go_start_ride(p_ride_id uuid, p_pin text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  r public.go_rides;
  real_pin text;
begin
  select * into r from public.go_rides where id = p_ride_id for update;
  if not found or r.rider_id is distinct from me then raise exception 'Ride not found'; end if;
  if r.status <> 'accepted' then raise exception 'This ride cannot be started now'; end if;
  select pin into real_pin from public.go_ride_secrets where ride_id = p_ride_id;
  if real_pin is null or real_pin <> btrim(coalesce(p_pin, '')) then
    raise exception 'Wrong PIN. Ask the passenger for her 4-digit PIN.';
  end if;
  update public.go_rides set status = 'in_progress', started_at = now() where id = p_ride_id;
  perform public.notify_member(r.passenger_id, me, 'go_started', 'Your SheRides Go ride has started. Stay safe!', '/go/ride/' || p_ride_id);
end;
$$;
revoke all on function public.go_start_ride(uuid, text) from public, anon;
grant execute on function public.go_start_ride(uuid, text) to authenticated;

create or replace function public.go_complete_ride(p_ride_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  r public.go_rides;
begin
  select * into r from public.go_rides where id = p_ride_id for update;
  if not found or r.rider_id is distinct from me then raise exception 'Ride not found'; end if;
  if r.status <> 'in_progress' then raise exception 'Only a started ride can be completed'; end if;
  update public.go_rides set status = 'completed', completed_at = now() where id = p_ride_id;
  insert into public.go_rider_state (user_id, completed_rides) values (me, 1)
  on conflict (user_id) do update set completed_rides = public.go_rider_state.completed_rides + 1;
  perform public.notify_member(r.passenger_id, me, 'go_completed', 'Ride complete. Please rate your rider.', '/go/ride/' || p_ride_id);
end;
$$;
revoke all on function public.go_complete_ride(uuid) from public, anon;
grant execute on function public.go_complete_ride(uuid) to authenticated;

create or replace function public.go_cancel_ride(p_ride_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  r public.go_rides;
  other uuid;
begin
  select * into r from public.go_rides where id = p_ride_id for update;
  if not found or (r.passenger_id <> me and r.rider_id is distinct from me and not public.is_admin()) then
    raise exception 'Ride not found';
  end if;
  if r.status not in ('requested', 'accepted') then raise exception 'A started or finished ride cannot be cancelled'; end if;

  if r.rider_id = me and r.passenger_id <> me then
    -- Rider backs out: put the ride back on the board instead of killing it.
    update public.go_rides set rider_id = null, status = 'requested', accepted_at = null where id = p_ride_id;
    perform public.notify_member(r.passenger_id, me, 'go_rider_cancelled', 'Your rider cancelled. We are finding another rider.', '/go/ride/' || p_ride_id);
    return;
  end if;

  update public.go_rides
  set status = 'cancelled', cancelled_by = me, cancelled_at = now(),
      cancel_reason = nullif(btrim(left(coalesce(p_reason, ''), 200)), '')
  where id = p_ride_id;
  other := case when me = r.passenger_id then r.rider_id else r.passenger_id end;
  if other is not null then
    perform public.notify_member(other, me, 'go_cancelled', 'A SheRides Go ride was cancelled', '/go/ride/' || p_ride_id);
  end if;
end;
$$;
revoke all on function public.go_cancel_ride(uuid, text) from public, anon;
grant execute on function public.go_cancel_ride(uuid, text) to authenticated;

create or replace function public.go_rate_ride(p_ride_id uuid, p_stars integer, p_feedback text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  r public.go_rides;
  admin_row record;
begin
  if p_stars not between 1 and 5 then raise exception 'Rating must be 1 to 5'; end if;
  select * into r from public.go_rides where id = p_ride_id for update;
  if not found or r.status <> 'completed' then raise exception 'Only completed rides can be rated'; end if;

  if me = r.passenger_id then
    if r.rider_rating is not null then raise exception 'Already rated'; end if;
    update public.go_rides set rider_rating = p_stars,
      rider_feedback = nullif(btrim(left(coalesce(p_feedback, ''), 500)), '') where id = p_ride_id;
    update public.go_rider_state set rating_sum = rating_sum + p_stars, rating_count = rating_count + 1
    where user_id = r.rider_id;
  elsif me = r.rider_id then
    if r.passenger_rating is not null then raise exception 'Already rated'; end if;
    update public.go_rides set passenger_rating = p_stars,
      passenger_feedback = nullif(btrim(left(coalesce(p_feedback, ''), 500)), '') where id = p_ride_id;
  else
    raise exception 'Ride not found';
  end if;

  -- Low ratings go straight to admins for review.
  if p_stars <= 2 then
    for admin_row in select id from public.profiles where role = 'admin' loop
      perform public.notify_member(admin_row.id, me, 'go_low_rating',
        'Low SheRides Go rating (' || p_stars || '★) needs review', '/admin/go');
    end loop;
  end if;
end;
$$;
revoke all on function public.go_rate_ride(uuid, integer, text) from public, anon;
grant execute on function public.go_rate_ride(uuid, integer, text) to authenticated;

create or replace function public.go_set_online(p_online boolean, p_lat double precision, p_lng double precision)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null or not public.go_is_approved('rider') then raise exception 'Only approved riders can go online'; end if;
  insert into public.go_rider_state (user_id, is_online, lat, lng, updated_at)
  values (me, coalesce(p_online, false), p_lat, p_lng, now())
  on conflict (user_id) do update set
    -- p_online null = only a location update (e.g. from the ride page), keep online state.
    is_online = coalesce(p_online, public.go_rider_state.is_online),
    lat = coalesce(p_lat, public.go_rider_state.lat),
    lng = coalesce(p_lng, public.go_rider_state.lng),
    updated_at = now();

  -- Share the rider's live position on her active rides.
  if p_lat is not null and p_lng is not null then
    update public.go_rides set rider_lat = p_lat, rider_lng = p_lng, rider_seen_at = now()
    where rider_id = me and status in ('accepted', 'in_progress');
  end if;
end;
$$;
revoke all on function public.go_set_online(boolean, double precision, double precision) from public, anon;
grant execute on function public.go_set_online(boolean, double precision, double precision) to authenticated;

-- Rider public card for a ride participant: name, photo, bike, rating. No NID, no phone.
create or replace function public.go_rider_card(p_ride_id uuid)
returns table (full_name text, avatar_url text, bike_model text, bike_plate text, rating numeric, completed_rides integer)
language sql
stable
security definer
set search_path = ''
as $$
  select p.full_name, p.avatar_url, a.bike_model, a.bike_plate,
         case when s.rating_count > 0 then round(s.rating_sum::numeric / s.rating_count, 1) end,
         coalesce(s.completed_rides, 0)
  from public.go_rides r
  join public.profiles p on p.id = r.rider_id
  join public.go_applications a on a.user_id = r.rider_id and a.role = 'rider'
  left join public.go_rider_state s on s.user_id = r.rider_id
  where r.id = p_ride_id
    and ((select auth.uid()) in (r.passenger_id, r.rider_id) or public.is_admin());
$$;
revoke all on function public.go_rider_card(uuid) from public, anon;
grant execute on function public.go_rider_card(uuid) to authenticated;

-- Public trip-share page (family can follow without logging in). Token only, minimal data.
create or replace function public.go_shared_trip(p_token uuid)
returns table (
  status text, pickup_text text, drop_text text, rider_first_name text, bike_plate text,
  rider_lat double precision, rider_lng double precision, rider_seen_at timestamptz,
  started_at timestamptz, completed_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.status, r.pickup_text, r.drop_text, split_part(p.full_name, ' ', 1), a.bike_plate,
         r.rider_lat, r.rider_lng, r.rider_seen_at, r.started_at, r.completed_at
  from public.go_ride_secrets s
  join public.go_rides r on r.id = s.ride_id
  left join public.profiles p on p.id = r.rider_id
  left join public.go_applications a on a.user_id = r.rider_id and a.role = 'rider'
  where s.share_token = p_token
    and (r.completed_at is null or r.completed_at > now() - interval '2 hours');
$$;
revoke all on function public.go_shared_trip(uuid) from public;
grant execute on function public.go_shared_trip(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------
create or replace function public.go_admin_review(p_application_id uuid, p_status text, p_notes text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  app public.go_applications;
begin
  if (select auth.uid()) is null or not public.is_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('approved', 'rejected', 'suspended', 'pending') then raise exception 'Invalid status'; end if;
  select * into app from public.go_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;

  update public.go_applications
  set status = p_status, admin_notes = nullif(btrim(left(coalesce(p_notes, ''), 500)), ''),
      reviewed_by = (select auth.uid()), reviewed_at = now(), updated_at = now()
  where id = p_application_id;

  if p_status in ('rejected', 'suspended') and app.role = 'rider' then
    update public.go_rider_state set is_online = false where user_id = app.user_id;
  end if;

  perform public.notify_member(
    app.user_id, (select auth.uid()), 'go_review',
    case p_status
      when 'approved' then 'Your SheRides Go ' || app.role || ' verification is approved!'
      when 'rejected' then 'Your SheRides Go ' || app.role || ' verification needs changes'
      when 'suspended' then 'Your SheRides Go ' || app.role || ' access is suspended'
      else 'Your SheRides Go application is back under review' end,
    '/go'
  );
end;
$$;
revoke all on function public.go_admin_review(uuid, text, text) from public, anon;
grant execute on function public.go_admin_review(uuid, text, text) to authenticated;

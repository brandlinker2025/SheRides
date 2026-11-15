-- Partner-lead review, plus free ride extras.
-- Non-destructive: adds columns, tables, and functions. Does not drop SOS tables.
-- No NID, licence image, password, or card columns are added.

-- ---------------------------------------------------------------------------
-- Partner recruitment leads: pending until an admin approves or rejects.
-- Approving a lead does not create a login and does not allow going online.
-- ---------------------------------------------------------------------------
alter table public.partner_applications
  add column if not exists status text not null default 'pending',
  add column if not exists admin_notes text,
  add column if not exists reviewed_by uuid,
  add column if not exists reviewed_at timestamptz;

alter table public.partner_applications
  drop constraint if exists partner_applications_status_check;
alter table public.partner_applications
  add constraint partner_applications_status_check
  check (status in ('pending', 'approved', 'rejected'));

alter table public.partner_applications
  drop constraint if exists partner_applications_admin_notes_len;
alter table public.partner_applications
  add constraint partner_applications_admin_notes_len
  check (admin_notes is null or char_length(admin_notes) <= 500);

create index if not exists partner_applications_status_idx
  on public.partner_applications (status, created_at desc);

create or replace function public.admin_review_partner_application(
  p_id uuid,
  p_status text,
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Invalid status';
  end if;
  if p_status = 'rejected' and char_length(btrim(coalesce(p_notes, ''))) < 2 then
    raise exception 'Write a short reason before rejecting';
  end if;

  update public.partner_applications
  set status = p_status,
      admin_notes = nullif(btrim(left(coalesce(p_notes, ''), 500)), ''),
      reviewed_by = (select auth.uid()),
      reviewed_at = now()
  where id = p_id;

  if not found then
    raise exception 'Application not found';
  end if;
end;
$$;

revoke all on function public.admin_review_partner_application(uuid, text, text) from public, anon;
grant execute on function public.admin_review_partner_application(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Riders cannot go online unless their in-app rider application is approved.
-- go_set_online / go_accept_ride already check this. The trigger is a backstop
-- if a row is written another way. Rejected and suspended riders are forced offline.
-- ---------------------------------------------------------------------------
create or replace function public.go_rider_is_approved(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.go_applications a
    join public.profiles p on p.id = a.user_id
    where a.user_id = p_user_id
      and a.role = 'rider'
      and a.status = 'approved'
      and (p.verified = true or p.role = 'admin')
  );
$$;

revoke all on function public.go_rider_is_approved(uuid) from public, anon, authenticated;

create or replace function public.go_guard_rider_online()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_online and not public.go_rider_is_approved(new.user_id) then
    raise exception 'Waiting for admin approval. You cannot go online yet';
  end if;
  return new;
end;
$$;

revoke all on function public.go_guard_rider_online() from public, anon, authenticated;

drop trigger if exists go_guard_rider_online on public.go_rider_state;
create trigger go_guard_rider_online
  before insert or update on public.go_rider_state
  for each row execute function public.go_guard_rider_online();

revoke insert, update, delete on table public.go_rider_state from anon, authenticated;

create or replace function public.go_set_online(p_online boolean, p_lat double precision, p_lng double precision)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'Sign in first';
  end if;
  if not public.go_rider_is_approved(me) then
    if exists (
      select 1 from public.go_applications
      where user_id = me and role = 'rider' and status = 'pending'
    ) then
      raise exception 'Waiting for admin approval. You cannot go online yet';
    end if;
    raise exception 'Only approved riders can go online';
  end if;

  insert into public.go_rider_state (user_id, is_online, lat, lng, updated_at)
  values (me, coalesce(p_online, false), p_lat, p_lng, now())
  on conflict (user_id) do update set
    is_online = coalesce(p_online, public.go_rider_state.is_online),
    lat = coalesce(p_lat, public.go_rider_state.lat),
    lng = coalesce(p_lng, public.go_rider_state.lng),
    updated_at = now();

  if p_lat is not null and p_lng is not null then
    update public.go_rides
    set rider_lat = p_lat, rider_lng = p_lng, rider_seen_at = now()
    where rider_id = me and status in ('accepted', 'in_progress');
  end if;
end;
$$;

revoke all on function public.go_set_online(boolean, double precision, double precision) from public, anon;
grant execute on function public.go_set_online(boolean, double precision, double precision) to authenticated;

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

-- ---------------------------------------------------------------------------
-- Saved places (home, work, and a few others). Members write only through RPCs.
-- ---------------------------------------------------------------------------
create table if not exists public.go_saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slot text not null check (slot in ('home', 'work', 'other')),
  label text not null check (char_length(btrim(label)) between 1 and 80),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists go_saved_places_home_work_idx
  on public.go_saved_places (user_id, slot)
  where slot in ('home', 'work');

create index if not exists go_saved_places_user_idx
  on public.go_saved_places (user_id, updated_at desc);

alter table public.go_saved_places enable row level security;

drop policy if exists "Members read own saved places" on public.go_saved_places;
create policy "Members read own saved places"
  on public.go_saved_places
  for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

revoke all on table public.go_saved_places from public, anon, authenticated;
grant select on table public.go_saved_places to authenticated;

create or replace function public.go_save_place(
  p_slot text,
  p_label text,
  p_lat double precision,
  p_lng double precision,
  p_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  saved uuid;
  clean_label text := btrim(coalesce(p_label, ''));
begin
  if me is null then raise exception 'Sign in first'; end if;
  if p_slot not in ('home', 'work', 'other') then raise exception 'Invalid place'; end if;
  if char_length(clean_label) < 1 or char_length(clean_label) > 80 then
    raise exception 'Name that place in 80 characters or fewer';
  end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'Choose a place from the suggestions';
  end if;

  if p_slot in ('home', 'work') then
    update public.go_saved_places
    set label = clean_label, lat = p_lat, lng = p_lng, updated_at = now()
    where user_id = me and slot = p_slot
    returning id into saved;
    if saved is null then
      insert into public.go_saved_places (user_id, slot, label, lat, lng)
      values (me, p_slot, clean_label, p_lat, p_lng)
      returning id into saved;
    end if;
    return saved;
  end if;

  if p_id is not null then
    update public.go_saved_places
    set label = clean_label, lat = p_lat, lng = p_lng, updated_at = now()
    where id = p_id and user_id = me and slot = 'other'
    returning id into saved;
    if saved is null then raise exception 'Place not found'; end if;
    return saved;
  end if;

  if (select count(*) from public.go_saved_places where user_id = me and slot = 'other') >= 8 then
    raise exception 'You can save up to 8 other places';
  end if;

  insert into public.go_saved_places (user_id, slot, label, lat, lng)
  values (me, 'other', clean_label, p_lat, p_lng)
  returning id into saved;
  return saved;
end;
$$;

revoke all on function public.go_save_place(text, text, double precision, double precision, uuid) from public, anon;
grant execute on function public.go_save_place(text, text, double precision, double precision, uuid) to authenticated;

create or replace function public.go_delete_place(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then raise exception 'Sign in first'; end if;
  delete from public.go_saved_places where id = p_id and user_id = me;
  if not found then raise exception 'Place not found'; end if;
end;
$$;

revoke all on function public.go_delete_place(uuid) from public, anon;
grant execute on function public.go_delete_place(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Favourite captains. Saving one does not assign her to the next ride.
-- ---------------------------------------------------------------------------
create table if not exists public.go_favourite_riders (
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (passenger_id, rider_id),
  constraint go_favourite_not_self check (passenger_id <> rider_id)
);

alter table public.go_favourite_riders enable row level security;

drop policy if exists "Members read own favourite riders" on public.go_favourite_riders;
create policy "Members read own favourite riders"
  on public.go_favourite_riders
  for select
  to authenticated
  using (passenger_id = (select auth.uid()) or public.is_admin());

revoke all on table public.go_favourite_riders from public, anon, authenticated;
grant select on table public.go_favourite_riders to authenticated;

create or replace function public.go_toggle_favourite(p_rider_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  existed boolean;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if p_rider_id is null or p_rider_id = me then raise exception 'Choose a captain'; end if;
  if not public.go_rider_is_approved(p_rider_id) then
    raise exception 'Only approved captains can be saved';
  end if;

  delete from public.go_favourite_riders
  where passenger_id = me and rider_id = p_rider_id
  returning true into existed;

  if existed then
    return false;
  end if;

  insert into public.go_favourite_riders (passenger_id, rider_id)
  values (me, p_rider_id);
  return true;
end;
$$;

revoke all on function public.go_toggle_favourite(uuid) from public, anon;
grant execute on function public.go_toggle_favourite(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Promo codes. The charged fare is changed only inside go_redeem_promo.
-- Percent codes are capped at 30. Flat codes are capped at ৳100.
-- The fare never drops below the existing minimum (৳70, or ৳250 for hire).
-- ---------------------------------------------------------------------------
create table if not exists public.go_promo_codes (
  code text primary key check (code ~ '^[A-Z0-9]{4,16}$'),
  kind text not null check (kind in ('percent', 'flat')),
  amount integer not null check (amount between 1 and 100),
  active boolean not null default true,
  max_uses integer not null default 1000 check (max_uses between 1 and 100000),
  uses integer not null default 0 check (uses >= 0),
  expires_at timestamptz,
  min_fare integer not null default 70 check (min_fare between 0 and 50000),
  created_at timestamptz not null default now(),
  constraint go_promo_percent_cap check (kind <> 'percent' or amount <= 30),
  constraint go_promo_flat_cap check (kind <> 'flat' or amount <= 100),
  constraint go_promo_uses_cap check (uses <= max_uses)
);

alter table public.go_promo_codes enable row level security;
revoke all on table public.go_promo_codes from public, anon, authenticated;

create table if not exists public.go_promo_redemptions (
  ride_id uuid primary key references public.go_rides(id) on delete cascade,
  code text not null references public.go_promo_codes(code),
  discount integer not null check (discount > 0),
  created_at timestamptz not null default now()
);

alter table public.go_promo_redemptions enable row level security;

drop policy if exists "Passenger reads own promo redemption" on public.go_promo_redemptions;
create policy "Passenger reads own promo redemption"
  on public.go_promo_redemptions
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.go_rides r
      where r.id = ride_id and r.passenger_id = (select auth.uid())
    )
  );

revoke all on table public.go_promo_redemptions from public, anon, authenticated;
grant select on table public.go_promo_redemptions to authenticated;

insert into public.go_promo_codes (code, kind, amount, active, max_uses, expires_at, min_fare)
values ('SHEWELCOME', 'percent', 10, true, 5000, timestamptz '2027-12-31 18:00:00+00', 70)
on conflict (code) do nothing;

create or replace function public.go_normalize_promo(p_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

revoke all on function public.go_normalize_promo(text) from public, anon, authenticated;

create or replace function public.go_quote_promo(p_code text, p_fare integer, p_kind text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  c public.go_promo_codes;
  code text := public.go_normalize_promo(p_code);
  floor_fare integer := case when p_kind = 'hire' then 250 else 70 end;
  raw integer;
  new_fare integer;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if p_fare is null or p_fare < 1 or p_fare > 50000 then raise exception 'Fare is not ready yet'; end if;
  select * into c from public.go_promo_codes where go_promo_codes.code = code;
  if not found or not c.active then raise exception 'That promo code is not active'; end if;
  if c.expires_at is not null and c.expires_at <= now() then raise exception 'That promo code has expired'; end if;
  if c.uses >= c.max_uses then raise exception 'That promo code has been used up'; end if;
  if p_fare < c.min_fare then raise exception 'This ride is below the minimum for that code'; end if;

  raw := case when c.kind = 'percent' then round(p_fare * c.amount / 100.0)::integer else c.amount end;
  new_fare := greatest(floor_fare, p_fare - raw);
  if new_fare >= p_fare then raise exception 'This code does not reduce the fare'; end if;

  return jsonb_build_object('code', c.code, 'discount', p_fare - new_fare, 'fare', new_fare);
end;
$$;

revoke all on function public.go_quote_promo(text, integer, text) from public, anon;
grant execute on function public.go_quote_promo(text, integer, text) to authenticated;

create or replace function public.go_redeem_promo(p_ride_id uuid, p_code text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  r public.go_rides;
  c public.go_promo_codes;
  code text := public.go_normalize_promo(p_code);
  floor_fare integer;
  raw integer;
  new_fare integer;
begin
  if me is null then raise exception 'Sign in first'; end if;

  select * into r from public.go_rides where id = p_ride_id for update;
  if not found or r.passenger_id <> me then raise exception 'Ride not found'; end if;
  if r.status <> 'requested' then raise exception 'A code can only be applied before a captain accepts'; end if;
  if exists (select 1 from public.go_promo_redemptions where ride_id = p_ride_id) then
    raise exception 'A promo code is already applied to this ride';
  end if;

  select * into c from public.go_promo_codes where go_promo_codes.code = code for update;
  if not found or not c.active then raise exception 'That promo code is not active'; end if;
  if c.expires_at is not null and c.expires_at <= now() then raise exception 'That promo code has expired'; end if;
  if c.uses >= c.max_uses then raise exception 'That promo code has been used up'; end if;
  if r.fare < c.min_fare then raise exception 'This ride is below the minimum for that code'; end if;

  floor_fare := case when r.kind = 'hire' then 250 else 70 end;
  raw := case when c.kind = 'percent' then round(r.fare * c.amount / 100.0)::integer else c.amount end;
  new_fare := greatest(floor_fare, r.fare - raw);
  if new_fare >= r.fare then raise exception 'This code does not reduce the fare'; end if;

  update public.go_promo_codes set uses = uses + 1 where go_promo_codes.code = c.code;
  update public.go_rides set fare = new_fare where id = r.id;
  insert into public.go_promo_redemptions (ride_id, code, discount)
  values (r.id, c.code, r.fare - new_fare);

  return new_fare;
end;
$$;

revoke all on function public.go_redeem_promo(uuid, text) from public, anon;
grant execute on function public.go_redeem_promo(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Extra stops. Fare stays pickup-to-final-drop. The stop is shared with the captain.
-- ---------------------------------------------------------------------------
create table if not exists public.go_ride_stops (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.go_rides(id) on delete cascade,
  position smallint not null check (position between 1 and 2),
  label text not null check (char_length(btrim(label)) between 2 and 200),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  unique (ride_id, position)
);

alter table public.go_ride_stops enable row level security;

drop policy if exists "Ride participants read stops" on public.go_ride_stops;
create policy "Ride participants read stops"
  on public.go_ride_stops
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.go_rides r
      where r.id = ride_id
        and (r.passenger_id = (select auth.uid()) or r.rider_id = (select auth.uid()))
    )
  );

revoke all on table public.go_ride_stops from public, anon, authenticated;
grant select on table public.go_ride_stops to authenticated;

create or replace function public.go_add_ride_stop(
  p_ride_id uuid,
  p_label text,
  p_lat double precision,
  p_lng double precision
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  next_pos integer;
  saved uuid;
  clean_label text := btrim(coalesce(p_label, ''));
begin
  if me is null then raise exception 'Sign in first'; end if;
  if char_length(clean_label) < 2 or char_length(clean_label) > 200 then
    raise exception 'Name the stop';
  end if;
  if p_lat is null or p_lng is null then raise exception 'Choose the stop from the suggestions'; end if;
  if not exists (
    select 1 from public.go_rides
    where id = p_ride_id and passenger_id = me and status = 'requested'
  ) then
    raise exception 'Stops can only be added before a captain accepts';
  end if;

  select coalesce(max(position), 0) + 1 into next_pos
  from public.go_ride_stops where ride_id = p_ride_id;
  if next_pos > 2 then raise exception 'Two stops is the maximum'; end if;

  insert into public.go_ride_stops (ride_id, position, label, lat, lng)
  values (p_ride_id, next_pos, clean_label, p_lat, p_lng)
  returning id into saved;
  return saved;
end;
$$;

revoke all on function public.go_add_ride_stop(uuid, text, double precision, double precision) from public, anon;
grant execute on function public.go_add_ride_stop(uuid, text, double precision, double precision) to authenticated;

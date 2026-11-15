-- Public SheRides partner recruitment leads.
--
-- Submitted only through POST /api/partner, which inserts with the service role.
-- The table deliberately has no NID, licence, password, or payment columns.
-- Anonymous and signed-in members cannot insert, update, or delete. Admins can read.

create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
  phone text not null check (phone ~ '^8801[3-9][0-9]{8}$'),
  area text not null check (char_length(btrim(area)) between 2 and 80),
  vehicle_type text not null check (vehicle_type in ('car', 'bike_scooter', 'none')),
  commitment text not null check (commitment in ('part_time', 'full_time')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists partner_applications_created_at_idx
  on public.partner_applications (created_at desc);

alter table public.partner_applications enable row level security;

revoke all on table public.partner_applications from public, anon, authenticated;

drop policy if exists "Admins read partner applications" on public.partner_applications;
create policy "Admins read partner applications"
  on public.partner_applications
  for select
  to authenticated
  using (public.is_admin());

grant select on table public.partner_applications to authenticated;

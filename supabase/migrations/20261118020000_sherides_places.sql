-- SheRides places: shops, offices and gates that public maps do not know
-- (for example Yamaha Flagship Center, Tejgaon). Staff pin them on the map in
-- Admin -> Places; they then appear first when anyone searches Pickup or Where to.
-- Safe to run more than once.

create table if not exists public.go_places (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  area text check (char_length(area) <= 100),
  lat double precision not null check (lat between 20 and 27),
  lng double precision not null check (lng between 88 and 93),
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.go_places enable row level security;
revoke all on public.go_places from anon, authenticated;
grant select on public.go_places to anon, authenticated;
grant insert, update, delete on public.go_places to authenticated;

drop policy if exists "Places readable by everyone" on public.go_places;
create policy "Places readable by everyone" on public.go_places
  for select to anon, authenticated using (active);

drop policy if exists "Staff manage places" on public.go_places;
create policy "Staff manage places" on public.go_places
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

notify pgrst, 'reload schema';

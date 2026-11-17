create table if not exists public.ride_insurance_settings (
  id boolean primary key default true check (id),
  provider text not null check (char_length(provider) between 1 and 120),
  summary text not null check (char_length(summary) between 1 and 1200),
  terms_url text not null check (terms_url ~ '^https://' and char_length(terms_url) <= 1024),
  published boolean not null default false
);

alter table public.ride_insurance_settings enable row level security;
revoke all on table public.ride_insurance_settings from public, anon, authenticated;
grant select on table public.ride_insurance_settings to anon, authenticated;
grant select, insert, update on table public.ride_insurance_settings to service_role;

drop policy if exists "Read published insurance" on public.ride_insurance_settings;
create policy "Read published insurance" on public.ride_insurance_settings
  for select to anon, authenticated using (published);

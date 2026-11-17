-- Partner (captain) applications: bike brand and chassis number.
-- Adds columns and a 16-argument go_submit_application. The original 14-argument version
-- stays so older app builds keep working. Chassis is only visible to the applicant and admins
-- (it is not part of the passenger-facing rider card).

alter table public.go_applications
  add column if not exists bike_brand text check (char_length(bike_brand) <= 40),
  add column if not exists bike_chassis text check (bike_chassis ~ '^[A-Z0-9-]{6,25}$');

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
  p_declared_female boolean,
  p_bike_brand text,
  p_bike_chassis text
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
    raise exception 'SheRides rides are for women only';
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
  if p_role = 'rider' then
    if nullif(btrim(p_bike_brand), '') is null then raise exception 'Add the bike brand'; end if;
    if upper(regexp_replace(coalesce(p_bike_chassis, ''), '[^A-Za-z0-9-]', '', 'g')) !~ '^[A-Z0-9-]{6,25}$' then
      raise exception 'Add a valid chassis number';
    end if;
  end if;

  select * into existing from public.go_applications where user_id = me and role = p_role;
  if found and existing.status in ('pending', 'approved') then
    raise exception 'You already have a % application (%).', p_role, existing.status;
  end if;
  if found and existing.status = 'suspended' then
    raise exception 'This account is suspended from SheRides rides. Contact an admin.';
  end if;

  insert into public.go_applications as a (
    user_id, role, status, full_name, nid_number, emergency_contact_name, emergency_contact_phone,
    nid_front_path, nid_back_path, selfie_path, license_number, license_path,
    bike_brand, bike_model, bike_plate, bike_chassis, bike_papers_path, declared_female, admin_notes, reviewed_by, reviewed_at
  ) values (
    me, p_role, 'pending', btrim(p_full_name), p_nid_number, nullif(btrim(p_emergency_name), ''),
    nullif(btrim(p_emergency_phone), ''), p_nid_front_path, p_nid_back_path, p_selfie_path,
    nullif(btrim(p_license_number), ''), p_license_path, nullif(btrim(p_bike_brand), ''), nullif(btrim(p_bike_model), ''),
    nullif(upper(btrim(p_bike_plate)), ''),
    nullif(upper(regexp_replace(coalesce(p_bike_chassis, ''), '[^A-Za-z0-9-]', '', 'g')), ''), p_bike_papers_path, true, null, null, null
  )
  on conflict (user_id, role) do update set
    status = 'pending', full_name = excluded.full_name, nid_number = excluded.nid_number,
    emergency_contact_name = excluded.emergency_contact_name,
    emergency_contact_phone = excluded.emergency_contact_phone,
    nid_front_path = excluded.nid_front_path, nid_back_path = excluded.nid_back_path,
    selfie_path = excluded.selfie_path, license_number = excluded.license_number,
    license_path = excluded.license_path, bike_brand = excluded.bike_brand, bike_model = excluded.bike_model,
    bike_chassis = excluded.bike_chassis,
    bike_plate = excluded.bike_plate, bike_papers_path = excluded.bike_papers_path,
    declared_female = true, admin_notes = null, reviewed_by = null, reviewed_at = null,
    updated_at = now()
  returning a.id into app_id;

  return app_id;
end;
$$;
revoke all on function public.go_submit_application(text, text, text, text, text, text, text, text, text, text, text, text, text, boolean, text, text) from public, anon;
grant execute on function public.go_submit_application(text, text, text, text, text, text, text, text, text, text, text, text, text, boolean, text, text) to authenticated;

notify pgrst, 'reload schema';

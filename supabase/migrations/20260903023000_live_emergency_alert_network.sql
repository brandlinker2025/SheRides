create table if not exists public.rider_locations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  updated_at timestamptz not null default now()
);

create table if not exists public.emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  problem_type text not null check (problem_type in ('accident','harassment','breakdown','unsafe_road','medical','other')),
  note text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  status text not null default 'active' check (status in ('active','resolved','cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.rider_locations enable row level security;
alter table public.emergency_alerts enable row level security;

drop policy if exists rider_locations_select_own on public.rider_locations;
create policy rider_locations_select_own on public.rider_locations for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists emergency_alerts_select_own_or_admin on public.emergency_alerts;
create policy emergency_alerts_select_own_or_admin on public.emergency_alerts for select to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.update_my_rider_location(p_latitude double precision, p_longitude double precision)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  insert into public.rider_locations(user_id, latitude, longitude, updated_at)
  values (auth.uid(), p_latitude, p_longitude, now())
  on conflict (user_id) do update set latitude = excluded.latitude, longitude = excluded.longitude, updated_at = now();
end;
$$;
grant execute on function public.update_my_rider_location(double precision,double precision) to authenticated;

create or replace function public.submit_emergency_alert(p_problem_type text, p_note text, p_latitude double precision, p_longitude double precision)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_alert_id uuid;
  v_name text;
  v_body text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_problem_type not in ('accident','harassment','breakdown','unsafe_road','medical','other') then raise exception 'Invalid problem type'; end if;

  insert into public.rider_locations(user_id, latitude, longitude, updated_at)
  values (auth.uid(), p_latitude, p_longitude, now())
  on conflict (user_id) do update set latitude=excluded.latitude, longitude=excluded.longitude, updated_at=now();

  insert into public.emergency_alerts(user_id, problem_type, note, latitude, longitude)
  values (auth.uid(), p_problem_type, nullif(left(trim(coalesce(p_note,'')),500),''), p_latitude, p_longitude)
  returning id into v_alert_id;

  select coalesce(full_name,'A rider') into v_name from public.profiles where id = auth.uid();
  v_body := 'URGENT ' || upper(replace(p_problem_type,'_',' ')) || ': ' || v_name || ' needs help nearby.';

  insert into public.notifications(user_id, actor_id, kind, body, href, read, created_at)
  select p.id, auth.uid(), 'emergency_alert', v_body, '/rider-benefits?alert=' || v_alert_id::text, false, now()
  from public.profiles p
  where p.id <> auth.uid()
    and (
      p.role = 'admin'
      or exists (
        select 1 from public.rider_locations rl
        where rl.user_id = p.id
          and rl.updated_at >= now() - interval '24 hours'
          and 6371 * 2 * asin(sqrt(
            power(sin(radians((rl.latitude - p_latitude) / 2)), 2) +
            cos(radians(p_latitude)) * cos(radians(rl.latitude)) *
            power(sin(radians((rl.longitude - p_longitude) / 2)), 2)
          )) <= 25
      )
    );

  return v_alert_id;
end;
$$;
grant execute on function public.submit_emergency_alert(text,text,double precision,double precision) to authenticated;

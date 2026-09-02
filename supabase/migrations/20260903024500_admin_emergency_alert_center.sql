create or replace function public.submit_emergency_alert(
  p_problem_type text,
  p_note text,
  p_latitude double precision,
  p_longitude double precision
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alert_id uuid;
  v_name text;
  v_body text;
  v_latitude double precision := p_latitude;
  v_longitude double precision := p_longitude;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_problem_type not in ('accident','harassment','breakdown','unsafe_road','medical','other') then
    raise exception 'Invalid problem type';
  end if;

  if v_latitude is null or v_longitude is null then
    select rl.latitude, rl.longitude into v_latitude, v_longitude
    from public.rider_locations rl
    where rl.user_id = auth.uid()
      and rl.updated_at >= now() - interval '24 hours';
  end if;

  if v_latitude is not null and v_longitude is not null then
    insert into public.rider_locations(user_id, latitude, longitude, updated_at)
    values (auth.uid(), v_latitude, v_longitude, now())
    on conflict (user_id) do update
      set latitude = excluded.latitude, longitude = excluded.longitude, updated_at = now();
  end if;

  insert into public.emergency_alerts(user_id, problem_type, note, latitude, longitude)
  values (auth.uid(), p_problem_type, nullif(left(trim(coalesce(p_note,'')),500),''), v_latitude, v_longitude)
  returning id into v_alert_id;

  select coalesce(full_name,'A rider') into v_name from public.profiles where id = auth.uid();
  v_body := 'URGENT ' || upper(replace(p_problem_type,'_',' ')) || ': ' || v_name || ' needs help.';

  insert into public.notifications(user_id, actor_id, kind, body, href, read, created_at)
  select distinct p.id, auth.uid(), 'emergency_alert', v_body,
         case when p.role = 'admin' then '/admin/emergency-alerts?alert=' || v_alert_id::text else '/rider-benefits?alert=' || v_alert_id::text end,
         false, now()
  from public.profiles p
  where p.role = 'admin'
     or (
       p.id <> auth.uid()
       and p.verified = true
       and v_latitude is not null
       and v_longitude is not null
       and exists (
         select 1 from public.rider_locations rl
         where rl.user_id = p.id
           and rl.updated_at >= now() - interval '24 hours'
           and 6371 * 2 * asin(sqrt(
             power(sin(radians((rl.latitude - v_latitude) / 2)), 2) +
             cos(radians(v_latitude)) * cos(radians(rl.latitude)) *
             power(sin(radians((rl.longitude - v_longitude) / 2)), 2)
           )) <= 25
       )
     );

  return v_alert_id;
end;
$$;

grant execute on function public.submit_emergency_alert(text,text,double precision,double precision) to authenticated;

create or replace function public.admin_list_emergency_alerts()
returns table(
  id uuid,
  user_id uuid,
  rider_name text,
  mobile_number text,
  problem_type text,
  note text,
  latitude double precision,
  longitude double precision,
  status text,
  created_at timestamptz,
  resolved_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select ea.id, ea.user_id, p.full_name, p.mobile_number, ea.problem_type, ea.note,
         ea.latitude, ea.longitude, ea.status, ea.created_at, ea.resolved_at
  from public.emergency_alerts ea
  join public.profiles p on p.id = ea.user_id
  where public.is_admin()
  order by case when ea.status = 'active' then 0 else 1 end, ea.created_at desc;
$$;

grant execute on function public.admin_list_emergency_alerts() to authenticated;

create or replace function public.admin_resolve_emergency_alert(p_alert_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  update public.emergency_alerts
  set status = 'resolved', resolved_at = now()
  where id = p_alert_id and status = 'active';
end;
$$;

grant execute on function public.admin_resolve_emergency_alert(uuid) to authenticated;

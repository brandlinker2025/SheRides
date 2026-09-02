alter table public.emergency_alerts alter column latitude drop not null;
alter table public.emergency_alerts alter column longitude drop not null;

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
    select rl.latitude, rl.longitude
      into v_latitude, v_longitude
    from public.rider_locations rl
    where rl.user_id = auth.uid()
      and rl.updated_at >= now() - interval '24 hours';
  end if;

  if v_latitude is not null and v_longitude is not null then
    insert into public.rider_locations(user_id, latitude, longitude, updated_at)
    values (auth.uid(), v_latitude, v_longitude, now())
    on conflict (user_id) do update
      set latitude = excluded.latitude,
          longitude = excluded.longitude,
          updated_at = now();
  end if;

  insert into public.emergency_alerts(user_id, problem_type, note, latitude, longitude)
  values (
    auth.uid(),
    p_problem_type,
    nullif(left(trim(coalesce(p_note,'')),500),''),
    v_latitude,
    v_longitude
  )
  returning id into v_alert_id;

  select coalesce(full_name,'A rider') into v_name
  from public.profiles
  where id = auth.uid();

  v_body := 'URGENT ' || upper(replace(p_problem_type,'_',' ')) || ': ' || v_name || ' needs help.';

  insert into public.notifications(user_id, actor_id, kind, body, href, read, created_at)
  select p.id, auth.uid(), 'emergency_alert', v_body,
         '/rider-benefits?alert=' || v_alert_id::text, false, now()
  from public.profiles p
  where p.id <> auth.uid()
    and (
      p.role = 'admin'
      or (
        p.verified = true
        and v_latitude is not null
        and v_longitude is not null
        and exists (
          select 1
          from public.rider_locations rl
          where rl.user_id = p.id
            and rl.updated_at >= now() - interval '24 hours'
            and 6371 * 2 * asin(sqrt(
              power(sin(radians((rl.latitude - v_latitude) / 2)), 2) +
              cos(radians(v_latitude)) * cos(radians(rl.latitude)) *
              power(sin(radians((rl.longitude - v_longitude) / 2)), 2)
            )) <= 25
        )
      )
    );

  return v_alert_id;
end;
$$;

grant execute on function public.submit_emergency_alert(text,text,double precision,double precision) to authenticated;

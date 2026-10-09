create or replace function public.get_emergency_alert_for_recipient(p_alert_id uuid)
returns table (
 id uuid, problem_type text, note text, latitude double precision, longitude double precision,
 status text, created_at timestamptz, rider_name text
)
language sql security definer set search_path = public
as $$
 select e.id, e.problem_type, e.note, e.latitude, e.longitude, e.status, e.created_at,
 coalesce(p.full_name, 'SheRides rider')::text
 from public.emergency_alerts e
 left join public.profiles p on p.id = e.user_id
 where e.id = p_alert_id and auth.uid() is not null
 and (
  e.user_id = auth.uid()
  or public.is_admin()
  or exists (
   select 1 from public.notifications n
   where n.user_id = auth.uid()
   and n.kind = 'emergency_alert'
   and n.href = '/rider-benefits?alert=' || e.id::text
  )
 );
$$;
revoke all on function public.get_emergency_alert_for_recipient(uuid) from public;
grant execute on function public.get_emergency_alert_for_recipient(uuid) to authenticated;
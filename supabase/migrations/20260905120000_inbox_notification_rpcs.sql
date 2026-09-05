-- Inbox RPCs so the bell can list and mark-read without silent RLS no-ops.
-- Additive only: no drops, no member/session changes.

create or replace function public.list_inbox_notifications(p_limit integer default 50)
returns table (
  id uuid,
  body text,
  href text,
  is_read boolean,
  created_at timestamptz,
  kind text,
  actor_id uuid,
  actor_name text,
  actor_avatar text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    n.id,
    n.body,
    n.href,
    n.read as is_read,
    n.created_at,
    n.kind,
    n.actor_id,
    coalesce(nullif(btrim(p.full_name), ''), 'SheRides') as actor_name,
    coalesce(p.avatar_url, '') as actor_avatar
  from public.notifications n
  left join public.profiles p on p.id = n.actor_id
  where n.user_id = (select auth.uid())
  order by n.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

revoke all on function public.list_inbox_notifications(integer) from public, anon;
grant execute on function public.list_inbox_notifications(integer) to authenticated;

create or replace function public.mark_inbox_read(p_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  n integer := 0;
begin
  if me is null then
    return 0;
  end if;

  update public.notifications
  set read = true
  where user_id = me
    and read = false
    and (p_id is null or id = p_id);

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.mark_inbox_read(uuid) from public, anon;
grant execute on function public.mark_inbox_read(uuid) to authenticated;

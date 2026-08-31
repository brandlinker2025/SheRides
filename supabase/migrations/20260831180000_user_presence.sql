-- Additive presence heartbeat. Does not drop tables, users, messages, or sessions.
-- Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE).

create table if not exists public.user_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

create index if not exists user_presence_last_seen_at_idx
  on public.user_presence (last_seen_at desc);

alter table public.user_presence enable row level security;

drop policy if exists "Members view presence" on public.user_presence;
create policy "Members view presence"
  on public.user_presence
  for select to authenticated
  using (public.is_approved_member() or (select auth.uid()) = user_id);

drop policy if exists "Users insert own presence" on public.user_presence;
create policy "Users insert own presence"
  on public.user_presence
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own presence" on public.user_presence;
create policy "Users update own presence"
  on public.user_presence
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on table public.user_presence to authenticated;

create or replace function public.heartbeat_presence()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  seen timestamptz := now();
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if not exists (select 1 from public.profiles p where p.id = me) then
    return null;
  end if;

  insert into public.user_presence (user_id, last_seen_at)
  values (me, seen)
  on conflict (user_id) do update set last_seen_at = excluded.last_seen_at;
  return seen;
end;
$$;

revoke all on function public.heartbeat_presence() from public, anon;
grant execute on function public.heartbeat_presence() to authenticated;

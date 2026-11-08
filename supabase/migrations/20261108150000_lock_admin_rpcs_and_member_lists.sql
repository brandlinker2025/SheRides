-- Live project irjybaasydqcfuldczeu.
--
-- admin_dashboard_counts, admin_list_members, admin_delete_member, and
-- admin_set_verified were security definer and executable by anon and
-- authenticated, without an is_admin() check. The admin UI calls the first
-- three with the server service role after requireAdmin(). Emergency-alert
-- and user-detail RPCs already require is_admin() and stay callable by a
-- signed-in admin session; anon execute is removed.
--
-- Group membership and event RSVP lists were readable by every approved
-- member because the permissive SELECT policy was USING (true). "Approved
-- members only" is already restrictive, so the replacement SELECT policy
-- stays permissive and limits rows to the caller or an admin. Members keep
-- their own rows. This does not choose the platform owner: is_admin() is
-- still profiles.role = 'admin'.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create or replace function private.assert_service_role()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role' then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.assert_service_role() from public, anon, authenticated;

create or replace function public.admin_dashboard_counts()
returns table(users bigint, verified bigint, pending_approval bigint, posts bigint, events bigint, signups_today bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform private.assert_service_role();
  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles as profile_row where profile_row.verified is true),
    (select count(*) from public.profiles as profile_row where profile_row.verified is not true and coalesce(profile_row.role, '') is distinct from 'admin'),
    (select count(*) from public.posts),
    (select count(*) from public.events),
    (select count(*) from public.profiles as profile_row where profile_row.created_at >= date_trunc('day', timezone('utc', now())));
end;
$$;

create or replace function public.admin_list_members()
returns setof public.profiles
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform private.assert_service_role();
  return query select * from public.profiles order by created_at asc;
end;
$$;

create or replace function public.admin_delete_member(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform private.assert_service_role();
  if target_id is null then
    raise exception 'Invalid request.';
  end if;
  if exists (
    select 1 from public.profiles p
    where p.id = target_id and p.role = 'admin'
  ) then
    raise exception 'You cannot remove an admin account.';
  end if;
  delete from auth.users where id = target_id;
  delete from public.profiles where id = target_id;
end;
$$;

create or replace function public.admin_set_verified(target_id uuid, is_verified boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.assert_service_role();
  if target_id is null or is_verified is null then
    raise exception 'Invalid request.';
  end if;
  update public.profiles
    set verified = is_verified
    where id = target_id;
  if not found then
    raise exception 'Could not update this member.';
  end if;
end;
$$;

revoke all on function public.admin_dashboard_counts() from public, anon, authenticated;
revoke all on function public.admin_list_members() from public, anon, authenticated;
revoke all on function public.admin_delete_member(uuid) from public, anon, authenticated;
revoke all on function public.admin_set_verified(uuid, boolean) from public, anon, authenticated;

grant execute on function public.admin_dashboard_counts() to service_role;
grant execute on function public.admin_list_members() to service_role;
grant execute on function public.admin_delete_member(uuid) to service_role;
grant execute on function public.admin_set_verified(uuid, boolean) to service_role;

revoke all on function public.admin_list_user_details() from public, anon;
revoke all on function public.admin_list_emergency_alerts() from public, anon;
revoke all on function public.admin_resolve_emergency_alert(uuid) from public, anon;
grant execute on function public.admin_list_user_details() to authenticated, service_role;
grant execute on function public.admin_list_emergency_alerts() to authenticated, service_role;
grant execute on function public.admin_resolve_emergency_alert(uuid) to authenticated, service_role;

drop policy if exists "Members view community memberships" on public.community_members;
drop policy if exists "Members view own memberships, admins view all" on public.community_members;
create policy "Members view own memberships, admins view all" on public.community_members
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Members view RSVPs" on public.event_rsvps;
drop policy if exists "Members view own RSVPs, admins view all" on public.event_rsvps;
create policy "Members view own RSVPs, admins view all" on public.event_rsvps
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

alter view public.profile_cards set (security_invoker = true);

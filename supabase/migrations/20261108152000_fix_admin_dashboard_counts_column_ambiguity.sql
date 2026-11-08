-- The plpgsql rewrite of admin_dashboard_counts() collided with its
-- output column named verified. Qualify the profile columns.

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

revoke all on function public.admin_dashboard_counts() from public, anon, authenticated;
grant execute on function public.admin_dashboard_counts() to service_role;

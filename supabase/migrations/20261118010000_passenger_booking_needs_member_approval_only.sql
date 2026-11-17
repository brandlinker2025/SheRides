-- SheRides: a passenger can book a Live Ride as soon as the admin has approved her membership.
-- The separate passenger NID application is no longer required (captains still need theirs).
-- Admins and moderators can also book. Safe to run more than once.

create or replace function public.go_is_approved(target_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when target_role = 'passenger' then exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and (p.verified = true or p.role in ('admin', 'moderator'))
    )
    else exists (
      select 1 from public.go_applications a
      join public.profiles p on p.id = a.user_id
      where a.user_id = (select auth.uid())
        and a.role = target_role
        and a.status = 'approved'
        and (p.verified = true or p.role in ('admin', 'moderator'))
    )
  end;
$$;
revoke all on function public.go_is_approved(text) from public, anon;
grant execute on function public.go_is_approved(text) to authenticated;

notify pgrst, 'reload schema';

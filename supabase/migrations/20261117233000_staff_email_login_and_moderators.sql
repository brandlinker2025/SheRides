-- SheRides staff access: admins and moderators sign in with an emailed login link (no password).
--
--   * New profile role 'moderator'. Only the service role (admin panel server code) can grant it;
--     member triggers already block members from changing their own role.
--   * public.is_staff() = admin or moderator.
--   * Moderators can review captain/passenger/partner applications and assign or cancel rides.
--     The live definitions of those RPCs are rewritten in place (is_admin -> is_staff), so no
--     other logic changes. Everything else (accounts, contacts, settings) stays admin-only.
--   * Safe to run more than once.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('rider', 'admin', 'moderator'));

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'moderator')
  );
$$;
revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

do $$
declare
  f record;
  def text;
begin
  for f in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('go_admin_review', 'admin_review_partner_application', 'go_admin_assign_ride', 'go_cancel_ride')
  loop
    def := pg_get_functiondef(f.oid);
    if position('public.is_admin()' in def) > 0 then
      execute replace(def, 'public.is_admin()', 'public.is_staff()');
    end if;
  end loop;
end;
$$;

notify pgrst, 'reload schema';

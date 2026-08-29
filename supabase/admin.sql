-- Incremental admin patch for an existing SheRides database.
-- Safe to re-run. Also included in schema.sql.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.ensure_first_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where role = 'admin') then
    update public.profiles
    set role = 'admin'
    where id = (
      select id from public.profiles
      order by created_at asc nulls last
      limit 1
    );
  end if;
end;
$$;

revoke all on function public.ensure_first_admin() from public;
grant execute on function public.ensure_first_admin() to authenticated;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    if not public.is_admin() and exists (select 1 from public.profiles where role = 'admin') then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

drop policy if exists "Admins update any profile" on public.profiles;
drop policy if exists "Admins delete any post" on public.posts;
drop policy if exists "Admins manage events" on public.events;

create policy "Admins update any profile" on public.profiles
  for update using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete any post" on public.posts
  for delete using (public.is_admin());

create policy "Admins manage events" on public.events
  for all using (public.is_admin())
  with check (public.is_admin());

select public.ensure_first_admin();

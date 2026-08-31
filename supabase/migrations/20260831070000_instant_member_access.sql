-- Instant community access: auto-approve riders so membership review
-- no longer blocks /home, feed, or messaging after signup or login.

alter table public.profiles
  alter column verified set default true;

update public.profiles
set verified = true
where verified = false;

-- Signed-in riders can use community tables without waiting on membership review.
create or replace function public.is_approved_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
  );
$$;

revoke all on function public.is_approved_member() from public, anon;
grant execute on function public.is_approved_member() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, username, avatar_url, role, verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'rider',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id and role = 'rider');

-- Avoid profile-policy recursion while keeping the approval predicate bound to auth.uid().
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
      and (verified = true or role = 'admin')
  );
$$;

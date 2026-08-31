-- New Joins wait for admin approval. Existing approved members stay approved.
-- Does not flip verified on current rows. No OTP.

alter table public.profiles
  alter column verified set default false;

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

revoke all on function public.is_approved_member() from public, anon;
grant execute on function public.is_approved_member() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text;
begin
  insert into public.profiles (id, full_name, username, avatar_url, role, verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'rider',
    false
  )
  on conflict (id) do nothing;

  v_phone := nullif(btrim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  if v_phone is not null then
    if v_phone !~ '^8801[0-9]{9}$' then
      raise exception 'invalid phone';
    end if;
    insert into public.member_phones (phone, user_id)
    values (v_phone, new.id);
  end if;

  perform public.send_welcome_message(new.id);
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

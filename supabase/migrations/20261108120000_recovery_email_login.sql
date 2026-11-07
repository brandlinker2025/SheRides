-- Free password reset by email for phone members.
--
-- Members sign up with a mobile number; their Supabase login email is a hidden
-- placeholder (8801XXXXXXXXX@phone.sherides.online) that cannot receive mail.
-- A member can now link a real email from Edit profile (Supabase sends the
-- verification link). After that her login email IS the real address, so the
-- built-in "reset password" email works at no cost.
--
-- Phone login must keep working after the switch. The browser first tries the
-- placeholder address; if that fails it calls member_login_email(phone, password),
-- which returns the linked email ONLY when the password is already correct.
-- Someone who knows a phone number but not the password learns nothing, and
-- repeated wrong guesses are rate limited per phone number.

create table if not exists public.login_email_lookup_attempts (
  id bigint generated always as identity primary key,
  phone text not null,
  attempted_at timestamptz not null default now()
);
create index if not exists login_email_lookup_attempts_phone_time
  on public.login_email_lookup_attempts (phone, attempted_at desc);

alter table public.login_email_lookup_attempts enable row level security;
-- No policies: only the security definer function below touches this table.
revoke all on public.login_email_lookup_attempts from anon, authenticated;

create or replace function public.member_login_email(p_phone text, p_password text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  found_email text;
  found_hash text;
  recent_failures integer;
begin
  if v_phone ~ '^01[0-9]{9}$' then v_phone := '88' || v_phone; end if;
  if v_phone !~ '^8801[0-9]{9}$' or coalesce(p_password, '') = '' then
    return null;
  end if;

  select count(*) into recent_failures
  from public.login_email_lookup_attempts
  where login_email_lookup_attempts.phone = v_phone
    and attempted_at > now() - interval '15 minutes';
  if recent_failures >= 8 then
    raise exception 'Too many sign-in attempts. Please wait 15 minutes and try again.';
  end if;

  select u.email, u.encrypted_password
    into found_email, found_hash
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.mobile_number = v_phone
    and u.email is not null
    and u.email not like '%@phone.sherides.online'
  limit 1;

  if found_hash is not null and found_hash = extensions.crypt(p_password, found_hash) then
    delete from public.login_email_lookup_attempts
    where login_email_lookup_attempts.phone = v_phone;
    return found_email;
  end if;

  insert into public.login_email_lookup_attempts (phone) values (v_phone);
  delete from public.login_email_lookup_attempts where attempted_at < now() - interval '1 day';
  return null;
end;
$$;

revoke all on function public.member_login_email(text, text) from public;
grant execute on function public.member_login_email(text, text) to anon, authenticated;

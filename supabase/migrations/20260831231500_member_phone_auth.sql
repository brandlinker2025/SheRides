-- Member phone auth: one BD mobile number per account, hashed OTPs, no session wipe.

create table if not exists public.member_phones (
  phone text primary key,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint member_phones_format check (phone ~ '^8801[0-9]{9}$')
);

create table if not exists public.phone_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  purpose text not null check (purpose in ('signup', 'reset')),
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists phone_otps_lookup
  on public.phone_otps (phone, purpose, created_at desc);

alter table public.member_phones enable row level security;
alter table public.phone_otps enable row level security;

drop policy if exists "Users read own phone row" on public.member_phones;
create policy "Users read own phone row" on public.member_phones
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.member_phones from public, anon;
grant select on table public.member_phones to authenticated;
grant all on table public.member_phones to service_role;

revoke all on table public.phone_otps from public, anon, authenticated;
grant all on table public.phone_otps to service_role;

create or replace function public.is_member_phone_taken(p_phone text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.member_phones
    where phone = p_phone
  );
$$;

revoke all on function public.is_member_phone_taken(text) from public;
grant execute on function public.is_member_phone_taken(text) to anon, authenticated;

create or replace function public.prepare_phone_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is not null and new.email like '%@phone.sherides.online' then
    new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists prepare_phone_member on auth.users;
create trigger prepare_phone_member
  before insert on auth.users
  for each row execute procedure public.prepare_phone_member();

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
    true
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

revoke all on function public.prepare_phone_member() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

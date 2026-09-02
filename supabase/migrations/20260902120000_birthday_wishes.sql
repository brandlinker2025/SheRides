-- Private date of birth + yearly birthday wish log.
-- DOB is NOT stored on public.profiles: that table is readable in community queries.
--
-- Feb 29 birthdays: leap years wish on 29 Feb; other years wish on 28 Feb.
-- Existing members keep NULL (no member_birthdays row) and can still sign in.

create table if not exists public.member_birthdays (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  date_of_birth date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_birthdays_dob_floor check (date_of_birth >= date '1920-01-01')
);

create table if not exists public.birthday_wishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  birthday_year integer not null,
  sent_at timestamptz not null default now(),
  notification_id uuid references public.notifications (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint birthday_wishes_year_range check (birthday_year >= 2020 and birthday_year <= 2100),
  constraint birthday_wishes_user_year_key unique (user_id, birthday_year)
);

create index if not exists birthday_wishes_user_id_idx on public.birthday_wishes (user_id);
create index if not exists birthday_wishes_notification_id_idx on public.birthday_wishes (notification_id);
create index if not exists member_birthdays_month_day_idx
  on public.member_birthdays ((extract(month from date_of_birth)), (extract(day from date_of_birth)));

alter table public.member_birthdays enable row level security;
alter table public.birthday_wishes enable row level security;

drop policy if exists "Users read own birthday" on public.member_birthdays;
create policy "Users read own birthday"
  on public.member_birthdays
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Admins read birthday wishes" on public.birthday_wishes;
create policy "Admins read birthday wishes"
  on public.birthday_wishes
  for select to authenticated
  using (public.is_admin() or user_id = (select auth.uid()));

revoke all on table public.member_birthdays from public, anon;
grant select on table public.member_birthdays to authenticated;
grant all on table public.member_birthdays to service_role;

revoke all on table public.birthday_wishes from public, anon;
grant select on table public.birthday_wishes to authenticated;
grant all on table public.birthday_wishes to service_role;

create or replace function public.save_own_date_of_birth(p_dob date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_today date := (timezone('Asia/Dhaka', now()))::date;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_dob is null then
    raise exception 'date of birth is required';
  end if;
  if p_dob > v_today then
    raise exception 'date of birth cannot be in the future';
  end if;
  if p_dob > (v_today - interval '13 years')::date then
    raise exception 'you must be at least 13 years old';
  end if;
  if p_dob < (v_today - interval '100 years')::date then
    raise exception 'enter a valid date of birth';
  end if;

  insert into public.member_birthdays (user_id, date_of_birth)
  values (v_uid, p_dob)
  on conflict (user_id) do update
    set date_of_birth = excluded.date_of_birth,
        updated_at = now();
end;
$$;

revoke all on function public.save_own_date_of_birth(date) from public, anon;
grant execute on function public.save_own_date_of_birth(date) to authenticated;

create or replace function public.deliver_birthday_wish(
  p_user_id uuid,
  p_year integer,
  p_body text,
  p_href text default '/home'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wish_id uuid;
  v_note_id uuid;
begin
  if p_user_id is null or p_year is null or p_body is null or btrim(p_body) = '' then
    return null;
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_user_id
      and (verified = true or role = 'admin')
  ) then
    return null;
  end if;

  if not exists (
    select 1
    from public.member_birthdays
    where user_id = p_user_id
  ) then
    return null;
  end if;

  insert into public.birthday_wishes (user_id, birthday_year)
  values (p_user_id, p_year)
  on conflict (user_id, birthday_year) do nothing
  returning id into v_wish_id;

  if v_wish_id is null then
    return null;
  end if;

  insert into public.notifications (user_id, actor_id, kind, body, href)
  values (p_user_id, null, 'birthday', p_body, coalesce(nullif(btrim(p_href), ''), '/home'))
  returning id into v_note_id;

  update public.birthday_wishes
  set notification_id = v_note_id,
      sent_at = now()
  where id = v_wish_id;

  return v_note_id;
end;
$$;

revoke all on function public.deliver_birthday_wish(uuid, integer, text, text) from public, anon, authenticated;
grant execute on function public.deliver_birthday_wish(uuid, integer, text, text) to service_role;

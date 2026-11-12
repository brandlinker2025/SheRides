-- SheRides: short in-ride messages between the passenger and her rider.
--
--   * Only the two people on a ride (and admins) can read its messages.
--   * Messages can be sent only while the ride is accepted or in progress,
--     and only through go_send_ride_message (no direct inserts).
--   * Phone numbers stay hidden; this replaces the old community messenger.
--   * Safe to run more than once.

create table if not exists public.go_ride_messages (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.go_rides(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists go_ride_messages_ride_idx on public.go_ride_messages (ride_id, created_at);

alter table public.go_ride_messages enable row level security;
revoke all on public.go_ride_messages from anon;
revoke insert, update, delete on public.go_ride_messages from authenticated;
grant select on public.go_ride_messages to authenticated;

drop policy if exists "Go ride messages for participants" on public.go_ride_messages;
create policy "Go ride messages for participants" on public.go_ride_messages
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.go_rides r
      where r.id = ride_id
        and ((select auth.uid()) = r.passenger_id or (select auth.uid()) = r.rider_id)
    )
  );

create or replace function public.go_send_ride_message(p_ride_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  r public.go_rides;
  v_body text := btrim(coalesce(p_body, ''));
  v_other uuid;
  v_id uuid;
begin
  if me is null then raise exception 'Sign in first'; end if;
  if char_length(v_body) < 1 or char_length(v_body) > 300 then
    raise exception 'Write a message of up to 300 characters';
  end if;

  select * into r from public.go_rides where id = p_ride_id;
  if not found or (r.passenger_id <> me and r.rider_id is distinct from me) then
    raise exception 'Ride not found';
  end if;
  if r.rider_id is null or r.status not in ('accepted', 'in_progress') then
    raise exception 'Messages are open only while the ride is active';
  end if;

  -- Simple flood guard: 20 messages a minute per person per ride.
  if (
    select count(*) from public.go_ride_messages
    where ride_id = p_ride_id and sender_id = me and created_at > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'Too many messages. Wait a moment.';
  end if;

  insert into public.go_ride_messages (ride_id, sender_id, body)
  values (p_ride_id, me, v_body)
  returning id into v_id;

  v_other := case when r.passenger_id = me then r.rider_id else r.passenger_id end;
  perform public.notify_member(v_other, me, 'go_message', left(v_body, 120), '/go/ride/' || p_ride_id);
  return v_id;
end;
$$;
revoke all on function public.go_send_ride_message(uuid, text) from public, anon;
grant execute on function public.go_send_ride_message(uuid, text) to authenticated;

-- Realtime so a new message appears on the other phone at once.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'go_ride_messages'
  ) then
    alter publication supabase_realtime add table public.go_ride_messages;
  end if;
end $$;

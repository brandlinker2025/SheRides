-- Social layer: live follow counts, DM send RPC, and 1000-follower gift.
-- Idempotent. Aligns messaging with instant member access so approved-gating
-- leftover from earlier audits cannot block Follow or Message.

-- Signed-in riders with a profile can use community tables.
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

-- Nested trigger updates (follow-count sync) may change counter columns.
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;
  if (select auth.uid()) = old.id and not public.is_admin() then
    if new.role is distinct from old.role
       or new.verified is distinct from old.verified
       or new.followers_count is distinct from old.followers_count
       or new.following_count is distinct from old.following_count
       or new.rides_count is distinct from old.rides_count then
      raise exception 'privileged profile fields cannot be changed by member';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.sync_follow_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  follower uuid := coalesce(new.follower_id, old.follower_id);
  followee uuid := coalesce(new.following_id, old.following_id);
begin
  update public.profiles
  set following_count = (
    select count(*)::integer from public.follows where follower_id = follower
  )
  where id = follower;

  update public.profiles
  set followers_count = (
    select count(*)::integer from public.follows where following_id = followee
  )
  where id = followee;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_follow_counts() from public, anon, authenticated;
drop trigger if exists sync_follow_counts on public.follows;
create trigger sync_follow_counts
  after insert or delete on public.follows
  for each row execute function public.sync_follow_counts();

-- Repair stale counters.
update public.profiles p
set
  followers_count = (select count(*)::integer from public.follows f where f.following_id = p.id),
  following_count = (select count(*)::integer from public.follows f where f.follower_id = p.id);

-- Open or reuse a 1:1 conversation. Any member with a profile can message another.
create or replace function public.get_or_create_dm(other_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  conv_id uuid;
begin
  if me is null or other_id is null or me = other_id then
    raise exception 'Invalid conversation';
  end if;
  if not exists (select 1 from public.profiles p where p.id = me) then
    raise exception 'Approved membership required';
  end if;
  if not exists (select 1 from public.profiles p where p.id = other_id) then
    raise exception 'Recipient is not a SheRides member';
  end if;

  select a.conversation_id into conv_id
  from public.conversation_members a
  join public.conversation_members b on a.conversation_id = b.conversation_id
  join public.conversations c on c.id = a.conversation_id
  where a.user_id = me
    and b.user_id = other_id
    and c.is_group = false
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  insert into public.conversations (is_group, updated_at)
  values (false, now())
  returning id into conv_id;

  insert into public.conversation_members (conversation_id, user_id)
  values (conv_id, me), (conv_id, other_id);
  return conv_id;
end;
$$;

revoke all on function public.get_or_create_dm(uuid) from public, anon;
grant execute on function public.get_or_create_dm(uuid) to authenticated;

-- Send a message as the signed-in member. Security definer so RLS cannot
-- swallow INSERT ... RETURNING after a successful write.
create or replace function public.send_conversation_message(
  target_conversation_id uuid,
  message_text text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  new_id uuid;
  body text := left(btrim(coalesce(message_text, '')), 5000);
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;
  if target_conversation_id is null or body = '' then
    raise exception 'Invalid message';
  end if;
  if not exists (
    select 1
    from public.conversation_members m
    where m.conversation_id = target_conversation_id
      and m.user_id = me
  ) then
    raise exception 'Not a conversation member';
  end if;

  insert into public.messages (conversation_id, sender_id, content)
  values (target_conversation_id, me, body)
  returning id into new_id;

  update public.conversations
  set updated_at = now()
  where id = target_conversation_id;

  return new_id;
end;
$$;

revoke all on function public.send_conversation_message(uuid, text) from public, anon;
grant execute on function public.send_conversation_message(uuid, text) to authenticated;

-- Bass Gift: 1,000 followers. Counts stay live via follows + sync_follow_counts;
-- the profile Achievements tab unlocks the badge from that live total.

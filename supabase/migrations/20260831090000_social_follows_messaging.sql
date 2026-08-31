-- Additive social-layer helpers. Does not drop tables, users, posts, or sessions.
-- CREATE OR REPLACE keeps existing RPC names/signatures so live clients keep working.

-- Open or reuse a 1:1 conversation. Same signature as production; only the
-- recipient check is relaxed so messaging another member does not require a
-- verified flag that leftover audit policies may still have false.
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
  if not public.is_approved_member() then
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

-- New send path. Existing INSERT into public.messages remains valid.
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
  -- Unicode as-is: Bangla and any other script are valid message bodies.
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

-- Bass Gift (1,000 followers) is computed in the app from live follows rows.
-- No profile rows are rewritten here.

-- Additive: members can react to DM messages. Does not drop tables, users,
-- messages, or sessions. Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE).

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji),
  constraint message_reactions_emoji_valid check (char_length(emoji) between 1 and 16)
);

create index if not exists message_reactions_message_id_idx
  on public.message_reactions (message_id);

create index if not exists message_reactions_user_id_idx
  on public.message_reactions (user_id);

alter table public.message_reactions enable row level security;

drop policy if exists "Members view message reactions" on public.message_reactions;
create policy "Members view message reactions"
  on public.message_reactions
  for select to authenticated
  using (
    exists (
      select 1
      from public.messages m
      where m.id = message_id
        and public.is_conversation_member(m.conversation_id)
    )
  );

drop policy if exists "Members insert own message reactions" on public.message_reactions;
create policy "Members insert own message reactions"
  on public.message_reactions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.messages m
      where m.id = message_id
        and public.is_conversation_member(m.conversation_id)
    )
  );

drop policy if exists "Members delete own message reactions" on public.message_reactions;
create policy "Members delete own message reactions"
  on public.message_reactions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, delete on table public.message_reactions to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.message_reactions;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

create or replace function public.toggle_message_reaction(
  target_message_id uuid,
  reaction_emoji text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  body text := left(btrim(coalesce(reaction_emoji, '')), 16);
  conv uuid;
  already boolean;
begin
  if me is null or target_message_id is null or body = '' then
    raise exception 'Invalid reaction';
  end if;

  select m.conversation_id into conv
  from public.messages m
  where m.id = target_message_id;

  if conv is null then
    raise exception 'Unknown message';
  end if;

  if not public.is_conversation_member(conv) then
    raise exception 'Not a conversation member';
  end if;

  select exists (
    select 1
    from public.message_reactions r
    where r.message_id = target_message_id
      and r.user_id = me
      and r.emoji = body
  ) into already;

  if already then
    delete from public.message_reactions
    where message_id = target_message_id
      and user_id = me
      and emoji = body;
    return false;
  end if;

  insert into public.message_reactions (message_id, user_id, emoji)
  values (target_message_id, me, body);
  return true;
end;
$$;

revoke all on function public.toggle_message_reaction(uuid, text) from public, anon;
grant execute on function public.toggle_message_reaction(uuid, text) to authenticated;

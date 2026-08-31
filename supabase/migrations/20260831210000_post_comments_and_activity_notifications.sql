-- Additive: persist post comment counts and write activity notifications.
-- Does not drop tables, users, posts, messages, follows, or sessions.
-- comments and notifications tables already exist; this only adds helpers/triggers.

create or replace function public.sync_post_comments_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_post_id uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts
  set comments_count = (
    select count(*)::integer
    from public.comments
    where post_id = target_post_id
  )
  where id = target_post_id;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_post_comments_count() from public, anon, authenticated;
drop trigger if exists sync_post_comments_count on public.comments;
create trigger sync_post_comments_count
  after insert or delete on public.comments
  for each row execute procedure public.sync_post_comments_count();

create or replace function public.notify_member(
  target_user_id uuid,
  actor uuid,
  note_kind text,
  note_body text,
  note_href text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_user_id is null or actor is null or target_user_id = actor then
    return;
  end if;
  if note_kind is null or btrim(note_kind) = '' or note_body is null or btrim(note_body) = '' then
    return;
  end if;

  update public.notifications
  set
    actor_id = actor,
    body = note_body,
    created_at = now(),
    read = false
  where user_id = target_user_id
    and kind = note_kind
    and href is not distinct from note_href
    and read = false;

  if found then
    return;
  end if;

  insert into public.notifications (user_id, actor_id, kind, body, href)
  values (target_user_id, actor, note_kind, note_body, note_href);
end;
$$;

revoke all on function public.notify_member(uuid, uuid, text, text, text) from public, anon, authenticated;

create or replace function public.notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  conv_title text;
  member_id uuid;
begin
  select c.title into conv_title
  from public.conversations c
  where c.id = new.conversation_id;

  -- Welcome DMs already insert their own notification in send_welcome_message.
  if conv_title = 'Welcome to SheRides' then
    return new;
  end if;

  for member_id in
    select m.user_id
    from public.conversation_members m
    where m.conversation_id = new.conversation_id
      and m.user_id is distinct from new.sender_id
  loop
    perform public.notify_member(
      member_id,
      new.sender_id,
      'message',
      'sent you a message',
      '/messages?c=' || new.conversation_id::text
    );
  end loop;
  return new;
end;
$$;

revoke all on function public.notify_on_message() from public, anon, authenticated;
drop trigger if exists notify_on_message on public.messages;
create trigger notify_on_message
  after insert on public.messages
  for each row execute procedure public.notify_on_message();

create or replace function public.notify_on_message_reaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  msg record;
begin
  select m.sender_id, m.conversation_id
  into msg
  from public.messages m
  where m.id = new.message_id;

  if msg.sender_id is null then
    return new;
  end if;

  perform public.notify_member(
    msg.sender_id,
    new.user_id,
    'reaction',
    'reacted to your message',
    '/messages?c=' || msg.conversation_id::text
  );
  return new;
end;
$$;

revoke all on function public.notify_on_message_reaction() from public, anon, authenticated;
drop trigger if exists notify_on_message_reaction on public.message_reactions;
create trigger notify_on_message_reaction
  after insert on public.message_reactions
  for each row execute procedure public.notify_on_message_reaction();

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  post_author uuid;
begin
  select p.author_id into post_author
  from public.posts p
  where p.id = new.post_id;

  perform public.notify_member(
    post_author,
    new.author_id,
    'comment',
    'commented on your post',
    '/home?post=' || new.post_id::text
  );
  return new;
end;
$$;

revoke all on function public.notify_on_comment() from public, anon, authenticated;
drop trigger if exists notify_on_comment on public.comments;
create trigger notify_on_comment
  after insert on public.comments
  for each row execute procedure public.notify_on_comment();

create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify_member(
    new.following_id,
    new.follower_id,
    'follow',
    'started following you',
    '/profile/' || new.follower_id::text
  );
  return new;
end;
$$;

revoke all on function public.notify_on_follow() from public, anon, authenticated;
drop trigger if exists notify_on_follow on public.follows;
create trigger notify_on_follow
  after insert on public.follows
  for each row execute procedure public.notify_on_follow();

create or replace function public.notify_on_post_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  post_author uuid;
begin
  select p.author_id into post_author
  from public.posts p
  where p.id = new.post_id;

  perform public.notify_member(
    post_author,
    new.user_id,
    'reaction',
    'reacted to your post',
    '/home?post=' || new.post_id::text
  );
  return new;
end;
$$;

revoke all on function public.notify_on_post_like() from public, anon, authenticated;
drop trigger if exists notify_on_post_like on public.post_likes;
create trigger notify_on_post_like
  after insert on public.post_likes
  for each row execute procedure public.notify_on_post_like();

create index if not exists notifications_user_unread_created_idx
  on public.notifications (user_id, created_at desc)
  where read = false;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

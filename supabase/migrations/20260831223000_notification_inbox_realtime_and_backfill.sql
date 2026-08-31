-- Keep notification inserts working for live members, and make the inbox
-- receivable over realtime. Additive only: no drops, no session wipes.

alter table public.notifications replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- Catch-up: existing follows/messages from before the notify triggers.
insert into public.notifications (user_id, actor_id, kind, body, href)
select f.following_id, f.follower_id, 'follow', 'started following you', '/profile/' || f.follower_id::text
from public.follows f
where f.follower_id <> f.following_id
  and f.follower_id not in (
    'a1111111-1111-4111-8111-111111111112',
    'a1111111-1111-4111-8111-111111111113',
    'a1111111-1111-4111-8111-111111111114',
    'a1111111-1111-4111-8111-111111111115'
  )
  and not exists (
    select 1
    from public.notifications n
    where n.user_id = f.following_id
      and n.actor_id = f.follower_id
      and n.kind = 'follow'
  );

insert into public.notifications (user_id, actor_id, kind, body, href)
select s.user_id, s.actor_id, 'message', 'sent you a message', s.href
from (
  select distinct on (cm.user_id, m.conversation_id)
    cm.user_id,
    m.sender_id as actor_id,
    '/messages?c=' || m.conversation_id::text as href
  from public.messages m
  join public.conversation_members cm
    on cm.conversation_id = m.conversation_id
   and cm.user_id <> m.sender_id
  join public.conversations c on c.id = m.conversation_id
  where coalesce(c.title, '') is distinct from 'Welcome to SheRides'
  order by cm.user_id, m.conversation_id, m.created_at desc
) s
where not exists (
  select 1
  from public.notifications n
  where n.user_id = s.user_id
    and n.kind = 'message'
    and n.href = s.href
);

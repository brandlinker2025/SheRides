-- SheRides audit follow-up.
-- Mirrors the production hardening applied on 2026-08-30 and keeps fresh environments aligned.

-- 1. Make approval gating restrictive so it ANDs with feature-specific RLS policies.
do $$
declare
  t text;
begin
  foreach t in array array[
    'comments','communities','community_members','conversation_members','conversations',
    'event_rsvps','events','follows','messages','notifications','post_likes','posts',
    'saved_posts','stories'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', 'Approved members only', t);
    execute format(
      'create policy %I on public.%I as restrictive for all to authenticated using (public.is_approved_member()) with check (public.is_approved_member())',
      'Approved members only', t
    );
  end loop;
end $$;

-- 2. Protect profile privilege and integrity fields from member-side updates.
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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

drop trigger if exists protect_profile_privileged_fields on public.profiles;
create trigger protect_profile_privileged_fields
before update on public.profiles
for each row execute function public.protect_profile_privileged_fields();

revoke execute on function public.protect_profile_privileged_fields() from public, anon, authenticated;

-- 3. Pending users may only see their own profile; approved users can see community profiles.
drop policy if exists "Authenticated members view profiles" on public.profiles;
drop policy if exists "Approved members or self view profiles" on public.profiles;
create policy "Approved members or self view profiles"
on public.profiles
for select
to authenticated
using (((select auth.uid()) = id) or public.is_approved_member());

-- 4. Enforce bucket-level media constraints and authenticated ownership policies.
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']::text[]
where id in ('avatars','posts');

drop policy if exists "Users upload own avatars" on storage.objects;
create policy "Users upload own avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and ((select auth.uid())::text = (storage.foldername(name))[1])
);

drop policy if exists "Users update own avatars" on storage.objects;
create policy "Users update own avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and ((select auth.uid())::text = (storage.foldername(name))[1])
)
with check (
  bucket_id = 'avatars'
  and ((select auth.uid())::text = (storage.foldername(name))[1])
);

drop policy if exists "Users upload post images" on storage.objects;
drop policy if exists "Approved users upload post images" on storage.objects;
create policy "Approved users upload post images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'posts'
  and public.is_approved_member()
  and ((select auth.uid())::text = (storage.foldername(name))[1])
);

-- 5. Keep a single pending application and prevent deletion of approved evidence.
create unique index if not exists verifications_one_pending_per_user_idx
on public.verifications(user_id)
where status = 'pending';

drop policy if exists "Users delete own pending verification documents" on storage.objects;
create policy "Users delete own pending verification documents"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'verifications'
  and ((select auth.uid())::text = (storage.foldername(name))[1])
  and exists (
    select 1
    from public.verifications v
    where v.user_id = (select auth.uid())
      and v.document_url = storage.objects.name
      and v.status in ('pending','rejected')
  )
);

-- 6. Harden SECURITY DEFINER workflows and delay community messaging until approval.
create or replace function public.get_or_create_dm(other_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  conv_id uuid;
begin
  if me is null or other_id is null or me = other_id then
    raise exception 'Invalid conversation';
  end if;
  if not public.is_approved_member() then
    raise exception 'Approved membership required';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = other_id and (p.verified = true or p.role = 'admin')
  ) then
    raise exception 'Recipient is not an approved member';
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

create or replace function public.send_welcome_message(new_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  leader_id uuid;
  conv_id uuid;
  welcome text := $msg$স্বাগতম SheRides-এ! 🏍️❤️ আপনি একজন চমৎকার বাইকার! আমরা বাংলাদেশের সকল নারী বাইকারদের একত্রিত করতে এই কমিউনিটি তৈরি করেছি। যেকোনো সমস্যায় আমরা সবাই আপনার পাশে আছি। একসাথে আমরা শক্তিশালী! 💪 - Razia Sultana Lina, Community Leader$msg$;
begin
  if new_user_id is null then return; end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = new_user_id and (p.verified = true or p.role = 'admin')
  ) then return; end if;

  select p.id into leader_id
  from public.profiles p
  where p.username = 'razia' or p.full_name ilike 'Razia Sultana Lina'
  order by case when p.username = 'razia' then 0 else 1 end
  limit 1;
  if leader_id is null or leader_id = new_user_id then return; end if;

  if exists (
    select 1
    from public.conversation_members a
    join public.conversation_members b on a.conversation_id = b.conversation_id
    join public.conversations c on c.id = a.conversation_id
    where a.user_id = leader_id and b.user_id = new_user_id and c.is_group = false
  ) then return; end if;

  insert into public.conversations (title, is_group, updated_at)
  values ('Welcome to SheRides', false, now())
  returning id into conv_id;
  insert into public.conversation_members (conversation_id, user_id)
  values (conv_id, leader_id), (conv_id, new_user_id);
  insert into public.messages (conversation_id, sender_id, content)
  values (conv_id, leader_id, welcome);
  insert into public.notifications (user_id, actor_id, kind, body, href)
  values (new_user_id, leader_id, 'welcome', 'Razia Sultana Lina sent you a welcome message', '/messages');
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, username, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'rider'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.review_rider_verification(
  target_verification_id uuid,
  approve boolean,
  review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  select user_id into target_user_id
  from public.verifications
  where id = target_verification_id
  for update;
  if target_user_id is null then raise exception 'Verification application not found'; end if;

  update public.verifications
  set status = case when approve then 'approved' else 'rejected' end,
      notes = nullif(btrim(left(coalesce(review_notes, ''), 500)), ''),
      reviewed_at = now(),
      reviewed_by = (select auth.uid())
  where id = target_verification_id;

  update public.profiles
  set verified = approve
  where id = target_user_id and role = 'rider';

  if approve then perform public.send_welcome_message(target_user_id); end if;
end;
$$;

create or replace function public.ensure_first_admin()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where role = 'admin') then
    update public.profiles
    set role = 'admin'
    where id = (
      select id from public.profiles
      order by created_at asc nulls last
      limit 1
    );
  end if;
end;
$$;

-- 7. Cover foreign keys used by feeds, messaging, events, follows and cleanup paths.
create index if not exists comments_author_id_idx on public.comments(author_id);
create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists community_members_user_id_idx on public.community_members(user_id);
create index if not exists conversation_members_user_id_idx on public.conversation_members(user_id);
create index if not exists event_rsvps_user_id_idx on public.event_rsvps(user_id);
create index if not exists events_created_by_idx on public.events(created_by);
create index if not exists follows_following_id_idx on public.follows(following_id);
create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists notifications_actor_id_idx on public.notifications(actor_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists post_likes_user_id_idx on public.post_likes(user_id);
create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists saved_posts_user_id_idx on public.saved_posts(user_id);
create index if not exists stories_author_id_idx on public.stories(author_id);

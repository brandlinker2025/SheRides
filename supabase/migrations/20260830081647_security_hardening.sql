-- SheRides security hardening.
-- This migration is idempotent where practical and is designed for the existing schema.

-- Bound user-controlled text and counters. NOT VALID preserves existing rows while
-- enforcing the constraints for every new or changed row.
alter table public.profiles
  add constraint profiles_full_name_length check (char_length(full_name) <= 120) not valid;
alter table public.profiles
  add constraint profiles_bio_length check (char_length(coalesce(bio, '')) <= 1000) not valid;
alter table public.profiles
  add constraint profiles_location_length check (char_length(coalesce(location, '')) <= 200) not valid;
alter table public.posts
  add constraint posts_content_length check (char_length(content) between 1 and 5000) not valid;
alter table public.posts
  add constraint posts_counts_nonnegative check (likes_count >= 0 and comments_count >= 0) not valid;
alter table public.comments
  add constraint comments_content_length check (char_length(content) between 1 and 2000) not valid;
alter table public.messages
  add constraint messages_payload_valid check (
    (content is not null and char_length(content) between 1 and 5000)
    or image_url is not null
  ) not valid;
alter table public.events
  add constraint events_title_length check (char_length(title) between 1 and 120) not valid;
alter table public.events
  add constraint events_description_length check (char_length(coalesce(description, '')) <= 5000) not valid;
alter table public.events
  add constraint events_time_order check (ends_at is null or ends_at >= starts_at) not valid;

-- Authorization helpers must not inherit a caller-controlled search path.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.is_conversation_member(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_members
    where conversation_id = target_conversation_id
      and user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_conversation_member(uuid) from public, anon;
grant execute on function public.is_conversation_member(uuid) to authenticated;

-- Browser clients must never be able to bootstrap or recover an admin role.
revoke all on function public.ensure_first_admin() from public, anon, authenticated;

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

  perform public.send_welcome_message(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Welcome messages are an internal signup-trigger operation, not a public RPC.
revoke all on function public.send_welcome_message(uuid) from public, anon, authenticated;

-- Prevent riders from changing security-managed profile fields through PostgREST.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.verified := old.verified;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute procedure public.protect_profile_privileges();

-- This is a members-only community: anonymous API callers cannot enumerate people or posts.
drop policy if exists "Public profiles are viewable" on public.profiles;
create policy "Authenticated members view profiles" on public.profiles
  for select to authenticated using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id and role = 'rider' and verified = false);

drop policy if exists "Posts are viewable" on public.posts;
create policy "Members view posts" on public.posts
  for select to authenticated using (true);

drop policy if exists "Users create own posts" on public.posts;
create policy "Users create own posts" on public.posts
  for insert to authenticated with check ((select auth.uid()) = author_id);

drop policy if exists "Users update own posts" on public.posts;
create policy "Users update own posts" on public.posts
  for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

drop policy if exists "Users delete own posts" on public.posts;
create policy "Users delete own posts" on public.posts
  for delete to authenticated using ((select auth.uid()) = author_id);

drop policy if exists "Likes are viewable" on public.post_likes;
create policy "Members view likes" on public.post_likes
  for select to authenticated using (true);

drop policy if exists "Users manage own likes" on public.post_likes;
create policy "Users insert own likes" on public.post_likes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users delete own likes" on public.post_likes
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Comments are viewable" on public.comments;
create policy "Members view comments" on public.comments
  for select to authenticated using (true);

drop policy if exists "Users create comments" on public.comments;
create policy "Users create comments" on public.comments
  for insert to authenticated with check ((select auth.uid()) = author_id);

drop policy if exists "Users delete own comments" on public.comments;
create policy "Users delete own comments" on public.comments
  for delete to authenticated using ((select auth.uid()) = author_id);

drop policy if exists "Users view own saved" on public.saved_posts;
drop policy if exists "Users manage own saved" on public.saved_posts;
create policy "Users view own saved" on public.saved_posts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own saved" on public.saved_posts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users delete own saved" on public.saved_posts
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Communities are viewable" on public.communities;
create policy "Members view communities" on public.communities
  for select to authenticated using (true);

drop policy if exists "Members viewable" on public.community_members;
create policy "Members view community memberships" on public.community_members
  for select to authenticated using (true);

drop policy if exists "Users join communities" on public.community_members;
create policy "Users join communities" on public.community_members
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users leave communities" on public.community_members;
create policy "Users leave communities" on public.community_members
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Events are viewable" on public.events;
create policy "Members view events" on public.events
  for select to authenticated using (true);

drop policy if exists "Users rsvp events" on public.event_rsvps;
drop policy if exists "RSVPs are viewable" on public.event_rsvps;
create policy "Members view RSVPs" on public.event_rsvps
  for select to authenticated using (true);
create policy "Users create own RSVPs" on public.event_rsvps
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users delete own RSVPs" on public.event_rsvps
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Avoid recursive RLS checks on conversation_members.
drop policy if exists "Members view conversations" on public.conversations;
create policy "Members view conversations" on public.conversations
  for select to authenticated using (public.is_conversation_member(id));

drop policy if exists "Members view conversation members" on public.conversation_members;
create policy "Members view conversation members" on public.conversation_members
  for select to authenticated using (public.is_conversation_member(conversation_id));

drop policy if exists "Members view messages" on public.messages;
create policy "Members view messages" on public.messages
  for select to authenticated using (public.is_conversation_member(conversation_id));

drop policy if exists "Members send messages" on public.messages;
create policy "Members send messages" on public.messages
  for insert to authenticated
  with check (
    (select auth.uid()) = sender_id
    and public.is_conversation_member(conversation_id)
  );

drop policy if exists "Users create conversations" on public.conversations;
create policy "Authenticated users create conversations" on public.conversations
  for insert to authenticated with check ((select auth.uid()) is not null);

drop policy if exists "Users update conversations" on public.conversations;
create policy "Members update conversations" on public.conversations
  for update to authenticated
  using (public.is_conversation_member(id))
  with check (public.is_conversation_member(id));

drop policy if exists "Users add conversation members" on public.conversation_members;
create policy "Users add self to conversations" on public.conversation_members
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users view own notifications" on public.notifications;
create policy "Users view own notifications" on public.notifications
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Follows are viewable" on public.follows;
create policy "Members view follows" on public.follows
  for select to authenticated using (true);

drop policy if exists "Users manage own follows" on public.follows;
create policy "Users create own follows" on public.follows
  for insert to authenticated
  with check ((select auth.uid()) = follower_id and follower_id <> following_id);
create policy "Users delete own follows" on public.follows
  for delete to authenticated using ((select auth.uid()) = follower_id);

drop policy if exists "Stories are viewable" on public.stories;
create policy "Members view stories" on public.stories
  for select to authenticated using (expires_at > now());

drop policy if exists "Users create own stories" on public.stories;
create policy "Users create own stories" on public.stories
  for insert to authenticated with check ((select auth.uid()) = author_id);

drop policy if exists "Users view own verifications" on public.verifications;
create policy "Users view own verifications" on public.verifications
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users submit own verifications" on public.verifications
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
    and document_type in ('driving_license', 'motorcycle_registration')
  );

drop policy if exists "Admins view all verifications" on public.verifications;
create policy "Admins view all verifications" on public.verifications
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins update verifications" on public.verifications;
create policy "Admins update verifications" on public.verifications
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Maintain counters in the database instead of trusting browser-provided values.
create or replace function public.sync_post_likes_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_post_id uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts
  set likes_count = (
    select count(*)::integer
    from public.post_likes
    where post_id = target_post_id
  )
  where id = target_post_id;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_post_likes_count() from public, anon, authenticated;
drop trigger if exists sync_post_likes_count on public.post_likes;
create trigger sync_post_likes_count
  after insert or delete on public.post_likes
  for each row execute procedure public.sync_post_likes_count();

-- Verification documents are private and never exposed through getPublicUrl().
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verifications',
  'verifications',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own verification documents" on storage.objects;
drop policy if exists "Users view own verification documents" on storage.objects;
drop policy if exists "Admins view verification documents" on storage.objects;
drop policy if exists "Users delete own pending verification documents" on storage.objects;

create policy "Users upload own verification documents" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'verifications'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users view own verification documents" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'verifications'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Admins view verification documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'verifications' and public.is_admin());

create policy "Users delete own pending verification documents" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'verifications'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

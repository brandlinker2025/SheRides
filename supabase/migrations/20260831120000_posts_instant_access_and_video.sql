-- Additive: let instant-access members insert posts, and allow optional video.
-- Does not drop tables, users, posts, or sessions. Safe to re-run.

-- 1. Membership for community tables is "has a profile", not a leftover
-- verified-document flag. Signup already skips /pending-approval; production
-- still had is_approved_member() from the audit helper, so "Approved members
-- only" on public.posts blocked text-only inserts.
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

-- 2. New profiles are instant-access. Existing rows stay; only the review flag
-- is flipped. User triggers on profiles can freeze `verified`, so disable them
-- for this postgres-role update and turn them back on immediately after.
alter table public.profiles
  alter column verified set default true;

alter table public.profiles disable trigger user;
update public.profiles
set verified = true
where verified = false;
alter table public.profiles enable trigger user;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
  perform public.send_welcome_message(new.id);
  return new;
end;
$$;

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id and role = 'rider');

-- 3. Caption is optional when a photo or video is attached. Text-only posts
-- still work (1–5000 chars). Photo/video-only posts are allowed.
alter table public.posts drop constraint if exists posts_content_length;
alter table public.posts
  add constraint posts_content_length check (
    char_length(coalesce(content, '')) <= 5000
    and (
      char_length(btrim(coalesce(content, ''))) >= 1
      or image_url is not null
    )
  ) not valid;

-- 4. Posts bucket may store short videos next to images. Avatars stay images.
update storage.buckets
set
  file_size_limit = 52428800,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[]
where id = 'posts';

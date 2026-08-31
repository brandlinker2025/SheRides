-- SheRides database schema
-- Run in the Supabase SQL editor after creating a project.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  full_name text not null default '',
  bio text default '',
  location text default '',
  bike text default '',
  avatar_url text,
  cover_url text,
  verified boolean not null default true,
  role text not null default 'rider' check (role in ('rider', 'admin')),
  followers_count integer not null default 0,
  following_count integer not null default 0,
  rides_count integer not null default 0,
  bike_brand text default '',
  bike_model text default '',
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists bike_brand text default '';
alter table public.profiles add column if not exists bike_model text default '';

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles on delete cascade,
  content text not null,
  image_url text,
  location text,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  author_id uuid not null references public.profiles on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_posts (
  post_id uuid not null references public.posts on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  location text,
  cover_url text,
  members_count integer not null default 0,
  activity text default 'Active',
  category text default 'Meetup'
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  status text not null default 'joined' check (status in ('joined', 'requested')),
  created_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind text not null default 'Ride' check (kind in ('Ride', 'Workshop', 'Meetup', 'Tour')),
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  cover_url text,
  attending_count integer not null default 0,
  featured boolean not null default false,
  created_by uuid references public.profiles on delete set null
);

create table if not exists public.event_rsvps (
  event_id uuid not null references public.events on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  is_group boolean not null default false,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations on delete cascade,
  sender_id uuid not null references public.profiles on delete cascade,
  content text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  actor_id uuid references public.profiles on delete set null,
  kind text not null,
  body text not null,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles on delete cascade,
  following_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  document_type text not null,
  document_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.saved_posts enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.follows enable row level security;
alter table public.stories enable row level security;
alter table public.verifications enable row level security;

drop policy if exists "Public profiles are viewable" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Posts are viewable" on public.posts;
drop policy if exists "Users create own posts" on public.posts;
drop policy if exists "Users update own posts" on public.posts;
drop policy if exists "Users delete own posts" on public.posts;
drop policy if exists "Likes are viewable" on public.post_likes;
drop policy if exists "Users manage own likes" on public.post_likes;
drop policy if exists "Comments are viewable" on public.comments;
drop policy if exists "Users create comments" on public.comments;
drop policy if exists "Users delete own comments" on public.comments;
drop policy if exists "Users view own saved" on public.saved_posts;
drop policy if exists "Users manage own saved" on public.saved_posts;
drop policy if exists "Communities are viewable" on public.communities;
drop policy if exists "Members viewable" on public.community_members;
drop policy if exists "Users join communities" on public.community_members;
drop policy if exists "Events are viewable" on public.events;
drop policy if exists "Users rsvp events" on public.event_rsvps;
drop policy if exists "RSVPs are viewable" on public.event_rsvps;
drop policy if exists "Members view conversations" on public.conversations;
drop policy if exists "Members view conversation members" on public.conversation_members;
drop policy if exists "Members view messages" on public.messages;
drop policy if exists "Members send messages" on public.messages;
drop policy if exists "Users view own notifications" on public.notifications;
drop policy if exists "Users update own notifications" on public.notifications;
drop policy if exists "Follows are viewable" on public.follows;
drop policy if exists "Users manage own follows" on public.follows;
drop policy if exists "Stories are viewable" on public.stories;
drop policy if exists "Users create own stories" on public.stories;
drop policy if exists "Users view own verifications" on public.verifications;
drop policy if exists "Admins view all verifications" on public.verifications;
drop policy if exists "Admins update verifications" on public.verifications;
drop policy if exists "Admins update any profile" on public.profiles;
drop policy if exists "Admins delete any post" on public.posts;
drop policy if exists "Admins manage events" on public.events;
drop policy if exists "Users leave communities" on public.community_members;
drop policy if exists "Users create conversations" on public.conversations;
drop policy if exists "Users add conversation members" on public.conversation_members;
drop policy if exists "Users update conversations" on public.conversations;

create policy "Public profiles are viewable" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Posts are viewable" on public.posts for select using (true);
create policy "Users create own posts" on public.posts for insert with check (auth.uid() = author_id);
create policy "Users update own posts" on public.posts for update using (auth.uid() = author_id);
create policy "Users delete own posts" on public.posts for delete using (auth.uid() = author_id);

create policy "Likes are viewable" on public.post_likes for select using (true);
create policy "Users manage own likes" on public.post_likes for all using (auth.uid() = user_id);

create policy "Comments are viewable" on public.comments for select using (true);
create policy "Users create comments" on public.comments for insert with check (auth.uid() = author_id);
create policy "Users delete own comments" on public.comments for delete using (auth.uid() = author_id);

create policy "Users view own saved" on public.saved_posts for select using (auth.uid() = user_id);
create policy "Users manage own saved" on public.saved_posts for all using (auth.uid() = user_id);

create policy "Communities are viewable" on public.communities for select using (true);
create policy "Members viewable" on public.community_members for select using (true);
create policy "Users join communities" on public.community_members for insert with check (auth.uid() = user_id);
create policy "Users leave communities" on public.community_members for delete using (auth.uid() = user_id);

create policy "Events are viewable" on public.events for select using (true);
create policy "Users rsvp events" on public.event_rsvps for all using (auth.uid() = user_id);
create policy "RSVPs are viewable" on public.event_rsvps for select using (true);

create policy "Members view conversations" on public.conversations for select using (
  exists (
    select 1 from public.conversation_members m
    where m.conversation_id = id and m.user_id = auth.uid()
  )
);
create policy "Members view conversation members" on public.conversation_members for select using (
  exists (
    select 1 from public.conversation_members m
    where m.conversation_id = conversation_members.conversation_id and m.user_id = auth.uid()
  )
);
create policy "Members view messages" on public.messages for select using (
  exists (
    select 1 from public.conversation_members m
    where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()
  )
);
create policy "Members send messages" on public.messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.conversation_members m
    where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()
  )
);
create policy "Users create conversations" on public.conversations for insert with check (true);
create policy "Users update conversations" on public.conversations for update using (
  exists (
    select 1 from public.conversation_members m
    where m.conversation_id = id and m.user_id = auth.uid()
  )
);
create policy "Users add conversation members" on public.conversation_members for insert with check (
  auth.uid() = user_id
);

create policy "Users view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications for update using (auth.uid() = user_id);

create policy "Follows are viewable" on public.follows for select using (true);
create policy "Users manage own follows" on public.follows for all using (auth.uid() = follower_id);

create policy "Stories are viewable" on public.stories for select using (true);
create policy "Users create own stories" on public.stories for insert with check (auth.uid() = author_id);

create policy "Users view own verifications" on public.verifications for select using (auth.uid() = user_id);
create policy "Admins view all verifications" on public.verifications for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "Admins update verifications" on public.verifications for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.ensure_first_admin()
returns void
language plpgsql
security definer
set search_path = public
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

revoke all on function public.ensure_first_admin() from public;
grant execute on function public.ensure_first_admin() to authenticated;

create policy "Admins update any profile" on public.profiles
  for update using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete any post" on public.posts
  for delete using (public.is_admin());

create policy "Admins manage events" on public.events
  for all using (public.is_admin())
  with check (public.is_admin());

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    if not public.is_admin() and exists (select 1 from public.profiles where role = 'admin') then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

create or replace function public.send_welcome_message(new_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  leader_id uuid;
  conv_id uuid;
  welcome text := $msg$স্বাগতম SheRides-এ! 🏍️❤️ আপনি একজন চমৎকার বাইকার! আমরা বাংলাদেশের সকল নারী বাইকারদের একত্রিত করতে এই কমিউনিটি তৈরি করেছি। যেকোনো সমস্যায় আমরা সবাই আপনার পাশে আছি। একসাথে আমরা শক্তিশালী! 💪 - Razia Sultana Lina, Community Leader$msg$;
begin
  if new_user_id is null then
    return;
  end if;

  select p.id into leader_id
  from public.profiles p
  where p.username = 'razia' or p.full_name ilike 'Razia Sultana Lina'
  order by case when p.username = 'razia' then 0 else 1 end
  limit 1;

  if leader_id is null or leader_id = new_user_id then
    return;
  end if;

  if exists (
    select 1
    from public.conversation_members a
    join public.conversation_members b on a.conversation_id = b.conversation_id
    join public.conversations c on c.id = a.conversation_id
    where a.user_id = leader_id
      and b.user_id = new_user_id
      and c.is_group = false
  ) then
    return;
  end if;

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

revoke all on function public.send_welcome_message(uuid) from public;
grant execute on function public.send_welcome_message(uuid) to authenticated;

create or replace function public.get_or_create_dm(other_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  conv_id uuid;
begin
  if me is null or other_id is null or me = other_id then
    raise exception 'Invalid conversation';
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

revoke all on function public.get_or_create_dm(uuid) from public;
grant execute on function public.get_or_create_dm(uuid) to authenticated;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('posts', 'posts', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Avatar images are public" on storage.objects;
drop policy if exists "Users upload own avatars" on storage.objects;
drop policy if exists "Users update own avatars" on storage.objects;
drop policy if exists "Post images are public" on storage.objects;
drop policy if exists "Users upload post images" on storage.objects;

create policy "Avatar images are public" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "Users upload own avatars" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users update own avatars" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Post images are public" on storage.objects
  for select using (bucket_id = 'posts');
create policy "Users upload post images" on storage.objects
  for insert with check (bucket_id = 'posts' and auth.uid()::text = (storage.foldername(name))[1]);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  assigned_role text := 'rider';
begin
  if not exists (select 1 from public.profiles) then
    assigned_role := 'admin';
  end if;

  insert into public.profiles (id, full_name, username, avatar_url, role, verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    assigned_role,
    true
  )
  on conflict (id) do nothing;

  perform public.ensure_first_admin();
  perform public.send_welcome_message(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

select public.ensure_first_admin();

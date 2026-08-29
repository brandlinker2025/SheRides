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
  verified boolean not null default false,
  role text not null default 'rider' check (role in ('rider', 'admin')),
  followers_count integer not null default 0,
  following_count integer not null default 0,
  rides_count integer not null default 0,
  created_at timestamptz not null default now()
);

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

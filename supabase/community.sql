-- Incremental community patch. Safe to re-run after an older schema.sql.

alter table public.profiles add column if not exists bike_brand text default '';
alter table public.profiles add column if not exists bike_model text default '';

drop policy if exists "Users leave communities" on public.community_members;
create policy "Users leave communities" on public.community_members for delete using (auth.uid() = user_id);

drop policy if exists "Users create conversations" on public.conversations;
create policy "Users create conversations" on public.conversations for insert with check (true);

drop policy if exists "Users update conversations" on public.conversations;
create policy "Users update conversations" on public.conversations for update using (
  exists (
    select 1 from public.conversation_members m
    where m.conversation_id = id and m.user_id = auth.uid()
  )
);

drop policy if exists "Users add conversation members" on public.conversation_members;
create policy "Users add conversation members" on public.conversation_members for insert with check (
  auth.uid() = user_id
);

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

grant execute on function public.send_welcome_message(uuid) to authenticated;
grant execute on function public.get_or_create_dm(uuid) to authenticated;

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

  insert into public.profiles (id, full_name, username, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    assigned_role
  )
  on conflict (id) do nothing;

  perform public.ensure_first_admin();
  perform public.send_welcome_message(new.id);
  return new;
end;
$$;

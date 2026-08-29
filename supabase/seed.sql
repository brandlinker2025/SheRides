-- SheRides sector test accounts, communities, and starter events.
-- Run after schema.sql (or schema.sql + community.sql).
-- Passwords: SheRides2025!

create extension if not exists pgcrypto;

create or replace function public.seed_auth_user(
  p_id uuid,
  p_email text,
  p_password text,
  p_full_name text,
  p_username text
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  instance uuid;
begin
  if exists (select 1 from auth.users where id = p_id or email = p_email) then
    return;
  end if;

  select id into instance from auth.instances limit 1;
  if instance is null then
    instance := '00000000-0000-0000-0000-000000000000';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) values (
    instance,
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'username', p_username),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email),
    'email',
    p_id::text,
    now(),
    now(),
    now()
  )
  on conflict do nothing;
end;
$$;

select public.seed_auth_user(
  'a1111111-1111-4111-8111-111111111111',
  'admin@sherides.com',
  'SheRides2025!',
  'Razia Sultana Lina',
  'razia'
);
select public.seed_auth_user(
  'a1111111-1111-4111-8111-111111111112',
  'dhaka_tester@sherides.com',
  'SheRides2025!',
  'Dhaka Tester',
  'dhaka_tester'
);
select public.seed_auth_user(
  'a1111111-1111-4111-8111-111111111113',
  'chittagong_tester@sherides.com',
  'SheRides2025!',
  'Chattogram Tester',
  'chittagong_tester'
);
select public.seed_auth_user(
  'a1111111-1111-4111-8111-111111111114',
  'sylhet_tester@sherides.com',
  'SheRides2025!',
  'Sylhet Tester',
  'sylhet_tester'
);
select public.seed_auth_user(
  'a1111111-1111-4111-8111-111111111115',
  'rajshahi_tester@sherides.com',
  'SheRides2025!',
  'Rajshahi Tester',
  'rajshahi_tester'
);

insert into public.profiles (id, username, full_name, bio, location, bike, bike_brand, bike_model, verified, role)
values
  (
    'a1111111-1111-4111-8111-111111111111',
    'razia',
    'Razia Sultana Lina',
    'Community Leader · Bangladesh Women Riders',
    'Dhaka',
    'Yamaha FZS V3',
    'Yamaha',
    'FZS V3',
    true,
    'admin'
  )
on conflict (id) do update set
  username = excluded.username,
  full_name = excluded.full_name,
  bio = excluded.bio,
  location = excluded.location,
  bike = excluded.bike,
  bike_brand = excluded.bike_brand,
  bike_model = excluded.bike_model,
  verified = true,
  role = 'admin';

insert into public.profiles (id, username, full_name, bio, location, bike, bike_brand, bike_model, role)
values
  ('a1111111-1111-4111-8111-111111111112', 'dhaka_tester', 'Dhaka Tester', 'Dhaka Female Bikers sector tester', 'Dhaka', 'Yamaha R15 V4', 'Yamaha', 'R15 V4', 'rider'),
  ('a1111111-1111-4111-8111-111111111113', 'chittagong_tester', 'Chattogram Tester', 'Chattogram Female Bikers sector tester', 'Chattogram', 'Suzuki Gixxer SF', 'Suzuki', 'Gixxer SF', 'rider'),
  ('a1111111-1111-4111-8111-111111111114', 'sylhet_tester', 'Sylhet Tester', 'Sylhet Female Bikers sector tester', 'Sylhet', 'Honda XBlade', 'Honda', 'XBlade', 'rider'),
  ('a1111111-1111-4111-8111-111111111115', 'rajshahi_tester', 'Rajshahi Tester', 'Rajshahi Female Bikers sector tester', 'Rajshahi', 'Bajaj Pulsar NS160', 'Bajaj', 'Pulsar NS160', 'rider')
on conflict (id) do update set
  username = excluded.username,
  full_name = excluded.full_name,
  bio = excluded.bio,
  location = excluded.location,
  bike = excluded.bike,
  bike_brand = excluded.bike_brand,
  bike_model = excluded.bike_model;

insert into public.communities (id, name, slug, description, location, cover_url, members_count, activity, category)
values
  (
    'c1111111-1111-4111-8111-111111111111',
    'Dhaka Female Bikers',
    'dhaka-female-bikers',
    'Capital city meetups, weekend escapes, and safe night rides for women in Dhaka.',
    'Dhaka',
    'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1400&q=80',
    1,
    'Very Active',
    'Meetup'
  ),
  (
    'c1111111-1111-4111-8111-111111111112',
    'Chattogram Female Bikers',
    'chattogram-female-bikers',
    'Coastal routes, port-city coffee runs, and sisterhood rides across Chattogram.',
    'Chattogram',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    1,
    'Active',
    'Touring'
  ),
  (
    'c1111111-1111-4111-8111-111111111113',
    'Sylhet Female Bikers',
    'sylhet-female-bikers',
    'Tea-garden touring, hill-road practice, and scenic group rides in Sylhet.',
    'Sylhet',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    1,
    'Active',
    'Touring'
  ),
  (
    'c1111111-1111-4111-8111-111111111114',
    'Rajshahi Female Bikers',
    'rajshahi-female-bikers',
    'Padma-side evening rides and beginner-friendly meetups in Rajshahi.',
    'Rajshahi',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=80',
    1,
    'Active',
    'Meetup'
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  location = excluded.location,
  cover_url = excluded.cover_url;

insert into public.community_members (community_id, user_id, status)
values
  ('c1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111112', 'joined'),
  ('c1111111-1111-4111-8111-111111111112', 'a1111111-1111-4111-8111-111111111113', 'joined'),
  ('c1111111-1111-4111-8111-111111111113', 'a1111111-1111-4111-8111-111111111114', 'joined'),
  ('c1111111-1111-4111-8111-111111111114', 'a1111111-1111-4111-8111-111111111115', 'joined'),
  ('c1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'joined')
on conflict do nothing;

insert into public.events (id, title, description, kind, location, starts_at, cover_url, featured, created_by)
values
  (
    'e1111111-1111-4111-8111-111111111111',
    'Dhanmondi Sunday Coffee Ride',
    'Easy city ride ending at a women-friendly cafe in Dhanmondi. Helmets on, no racing.',
    'Meetup',
    'Dhanmondi, Dhaka',
    now() + interval '7 days',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80',
    true,
    'a1111111-1111-4111-8111-111111111111'
  ),
  (
    'e1111111-1111-4111-8111-111111111112',
    'Cox''s Bazar Coastal Tour',
    'Weekend coastal touring for licensed riders. Pace is social, not sport.',
    'Tour',
    'Cox''s Bazar',
    now() + interval '21 days',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    false,
    'a1111111-1111-4111-8111-111111111111'
  ),
  (
    'e1111111-1111-4111-8111-111111111113',
    'Basic Bike Care Workshop',
    'Chain, brakes, and tire checks with other SheRides members in Dhaka.',
    'Workshop',
    'Tejgaon, Dhaka',
    now() + interval '14 days',
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1400&q=80',
    false,
    'a1111111-1111-4111-8111-111111111111'
  )
on conflict (id) do nothing;

select public.send_welcome_message('a1111111-1111-4111-8111-111111111112');
select public.send_welcome_message('a1111111-1111-4111-8111-111111111113');
select public.send_welcome_message('a1111111-1111-4111-8111-111111111114');
select public.send_welcome_message('a1111111-1111-4111-8111-111111111115');

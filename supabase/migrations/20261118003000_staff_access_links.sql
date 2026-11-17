-- SheRides: private staff login links (admin RS, moderators such as Sneha).
--
--   * Opening sherides.online/staff/<secret> signs that staff member in on that device and keeps
--     them signed in. No password and no email confirmation.
--   * Only a SHA-256 hash of each secret is stored. Admins create, copy and cancel links from
--     Admin -> Accounts. Creating a new link for a person cancels her old one.
--   * Only the server (service role) can read this table.
--   * Safe to run more than once.

create table if not exists public.staff_access_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  label text check (char_length(label) <= 80),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists staff_access_links_user_idx on public.staff_access_links (user_id);

alter table public.staff_access_links enable row level security;
revoke all on public.staff_access_links from anon, authenticated;

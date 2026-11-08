-- The first lockdown created the own-row policies as RESTRICTIVE. "Approved
-- members only" is already restrictive, and PostgreSQL shows no rows when a
-- command has only restrictive policies. Recreate the own-row rules as
-- permissive SELECT policies so an approved member still sees her own row.

drop policy if exists "Members view own memberships, admins view all" on public.community_members;
create policy "Members view own memberships, admins view all" on public.community_members
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Members view own RSVPs, admins view all" on public.event_rsvps;
create policy "Members view own RSVPs, admins view all" on public.event_rsvps
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

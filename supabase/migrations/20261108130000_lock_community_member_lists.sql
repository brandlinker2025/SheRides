-- Lock down community group details for non-admin members.
--
-- Before: any signed-in member could list EVERY member of EVERY group
-- (community_members) and EVERY attendee of EVERY event (event_rsvps),
-- because both SELECT policies were `using (true)`.
--
-- After: a member can only read her OWN membership / RSVP rows (which is all the
-- app needs to show "Joined" / "Going"). Admins can still read everything.
-- Insert/delete policies are unchanged (members still join/leave themselves).

drop policy if exists "Members view community memberships" on public.community_members;
create policy "Members view own memberships, admins view all" on public.community_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Members view RSVPs" on public.event_rsvps;
create policy "Members view own RSVPs, admins view all" on public.event_rsvps
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

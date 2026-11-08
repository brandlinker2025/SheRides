-- UNAPPLIED until the deployed app no longer selects these columns.
-- Live project: irjybaasydqcfuldczeu.
--
-- members_count and attending_count are global community statistics.
-- Table SELECT for authenticated still returns every other community and
-- event column. Do not apply this file while production still uses select *
-- on communities or events: PostgREST rejects the whole request when a
-- requested column is revoked.

revoke select (members_count) on table public.communities from anon, authenticated;
revoke select (attending_count) on table public.events from anon, authenticated;

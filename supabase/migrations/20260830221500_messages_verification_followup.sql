-- Allow members to mark their own threads as read without touching other rows.
drop policy if exists "Members update own last read" on public.conversation_members;
create policy "Members update own last read" on public.conversation_members
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

alter table public.verifications add column if not exists nid_number text;
alter table public.verifications add column if not exists driving_license_number text;
alter table public.verifications add column if not exists chassis_number text;
alter table public.verifications add column if not exists reviewed_at timestamptz;
alter table public.verifications add column if not exists reviewed_by uuid references public.profiles(id);

drop policy if exists "Users submit own verifications" on public.verifications;
create policy "Users submit own verifications" on public.verifications
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
    and document_type in ('driving_license', 'motorcycle_registration', 'identity_review')
  );

drop policy if exists "Users update own rejected verifications" on public.verifications;
create policy "Users update own rejected verifications" on public.verifications
  for update to authenticated
  using ((select auth.uid()) = user_id and status = 'rejected')
  with check ((select auth.uid()) = user_id and status = 'pending');

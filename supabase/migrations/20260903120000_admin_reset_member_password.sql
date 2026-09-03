-- Admin-only member password reset. Hashes in Postgres; never stores plaintext.
-- Does not delete sessions (no global logout). Refuses admin accounts.

create or replace function public.admin_reset_member_password(
  target_id uuid,
  new_password text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if target_id is null
     or new_password is null
     or char_length(new_password) < 6
     or char_length(new_password) > 72 then
    raise exception 'Invalid request.';
  end if;

  if exists (
    select 1
    from public.profiles p
    where p.id = target_id and p.role = 'admin'
  ) then
    raise exception 'You cannot reset an admin password.';
  end if;

  update auth.users
  set
    encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
    updated_at = now()
  where id = target_id;

  if not found then
    raise exception 'Could not reset this password.';
  end if;
end;
$$;

revoke all on function public.admin_reset_member_password(uuid, text) from public, anon;
grant execute on function public.admin_reset_member_password(uuid, text) to authenticated;

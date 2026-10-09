create or replace function public.protect_profile_approval_fields()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if current_user = 'authenticated'
     and not public.is_admin()
     and (new.role is distinct from old.role or new.verified is distinct from old.verified) then
    raise exception 'Approval and role changes require administrator authorization' using errcode = '42501';
  end if;
  return new;
end;
$$;
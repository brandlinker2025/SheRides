create or replace function public.protect_new_profile_approval()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if current_user = 'authenticated' and not public.is_admin() then
    if new.verified is distinct from false or new.role is distinct from 'rider' then
      raise exception 'New members must await administrator approval' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_new_profile_approval_trigger on public.profiles;
create trigger protect_new_profile_approval_trigger
before insert on public.profiles
for each row execute function public.protect_new_profile_approval();
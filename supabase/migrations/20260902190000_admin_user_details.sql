create or replace function public.admin_list_user_details()
returns table (
  id uuid,
  username text,
  full_name text,
  mobile_number text,
  date_of_birth date,
  bike_brand text,
  location text,
  role text,
  verified boolean,
  created_at timestamptz,
  avatar_url text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    p.id,
    p.username,
    p.full_name,
    u.phone as mobile_number,
    mb.date_of_birth,
    p.bike_brand,
    p.location,
    p.role,
    p.verified,
    p.created_at,
    p.avatar_url
  from public.profiles p
  left join auth.users u on u.id = p.id
  left join public.member_birthdays mb on mb.user_id = p.id
  where public.is_admin()
  order by p.created_at asc;
$$;

revoke all on function public.admin_list_user_details() from public;
grant execute on function public.admin_list_user_details() to authenticated;

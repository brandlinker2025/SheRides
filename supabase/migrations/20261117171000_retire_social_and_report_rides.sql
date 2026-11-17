begin;

create schema if not exists sherides_legacy;
revoke all on schema sherides_legacy from public, anon, authenticated, service_role;

-- Preserve historical rows and foreign-key relationships outside the API schema.
do $migration$
declare
  table_name text;
begin
  foreach table_name in array array[
    'communities', 'community_members', 'conversations', 'conversation_members',
    'messages', 'posts', 'comments', 'post_likes', 'follows', 'events',
    'event_rsvps', 'saved_posts', 'stories', 'message_reactions'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      if exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime drop table public.%I', table_name);
      end if;
      execute format('alter table public.%I set schema sherides_legacy', table_name);
      execute format('revoke all on table sherides_legacy.%I from public, anon, authenticated, service_role', table_name);
    end if;
  end loop;
end;
$migration$;

-- Older account-review routines may still invoke the retired welcome DM.
create or replace function public.send_welcome_message(new_user_id uuid)
returns void
language plpgsql
set search_path = ''
as $$ begin return; end; $$;

revoke all on function public.send_welcome_message(uuid) from public, anon, authenticated;

revoke execute on function public.get_or_create_dm(uuid) from public, anon, authenticated;
revoke execute on function public.send_conversation_message(uuid, text) from public, anon, authenticated;
revoke execute on function public.toggle_message_reaction(uuid, text) from public, anon, authenticated;

-- Retain the existing RPC signature for deployed admin clients.
create or replace function public.admin_dashboard_counts()
returns table (users bigint, verified bigint, pending_approval bigint, posts bigint, events bigint, signups_today bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.assert_service_role();
  return query
  select count(*), count(*) filter (where p.verified is true),
    count(*) filter (where p.verified is not true and p.role is distinct from 'admin'),
    0::bigint, 0::bigint,
    count(*) filter (where p.created_at >= date_trunc('day', now(), 'Asia/Dhaka'))
  from public.profiles p;
end;
$$;

create or replace function public.admin_ride_report(p_start date, p_end date)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  start_at timestamptz := p_start::timestamp at time zone 'Asia/Dhaka';
  end_at timestamptz := (p_end + 1)::timestamp at time zone 'Asia/Dhaka';
  result jsonb;
begin
  if p_start is null or p_end is null or p_end < p_start or p_end - p_start > 365 then
    raise exception 'Select a date range of up to 366 days';
  end if;
  select jsonb_build_object(
    'ridesRequested', (select count(*) from public.go_rides where created_at >= start_at and created_at < end_at),
    'ridesCompleted', (select count(*) from public.go_rides where status = 'completed' and completed_at >= start_at and completed_at < end_at),
    'ridesCancelled', (select count(*) from public.go_rides where status = 'cancelled' and cancelled_at >= start_at and cancelled_at < end_at),
    'completedFare', (select coalesce(sum(fare), 0) from public.go_rides where status = 'completed' and completed_at >= start_at and completed_at < end_at),
    'promoRedemptions', (select count(*) from public.go_promo_redemptions where created_at >= start_at and created_at < end_at),
    'promoDiscount', (select coalesce(sum(discount), 0) from public.go_promo_redemptions where created_at >= start_at and created_at < end_at),
    'captainApplications', (select count(*) from public.go_applications where role = 'rider' and created_at >= start_at and created_at < end_at),
    'captainApprovals', (select count(*) from public.go_applications where role = 'rider' and status = 'approved' and reviewed_at >= start_at and reviewed_at < end_at),
    'captainRejections', (select count(*) from public.go_applications where role = 'rider' and status = 'rejected' and reviewed_at >= start_at and reviewed_at < end_at),
    'insurancePublished', exists(select 1 from public.ride_insurance_settings where published)
  ) into result;
  return result;
end;
$$;

revoke all on function public.admin_ride_report(date, date) from public, anon, authenticated;
grant execute on function public.admin_ride_report(date, date) to service_role;

commit;

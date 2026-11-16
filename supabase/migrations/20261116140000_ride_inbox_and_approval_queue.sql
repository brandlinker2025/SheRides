-- Ride-only inbox and one approval path for passengers, captains and partner leads.
-- Non-destructive: tables, rows, and the SOS / social history stay in place.
-- Social triggers stop writing new inbox rows. Old rows stay and are filtered out of the list.

create or replace function public.list_inbox_notifications(p_limit integer default 50)
returns table (
  id uuid,
  body text,
  href text,
  is_read boolean,
  created_at timestamptz,
  kind text,
  actor_id uuid,
  actor_name text,
  actor_avatar text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    n.id,
    n.body,
    n.href,
    n.read as is_read,
    n.created_at,
    n.kind,
    n.actor_id,
    coalesce(nullif(btrim(p.full_name), ''), 'SheRides') as actor_name,
    coalesce(p.avatar_url, '') as actor_avatar
  from public.notifications n
  left join public.profiles p on p.id = n.actor_id
  where n.user_id = (select auth.uid())
    and n.kind in (
      'go_request', 'go_accepted', 'go_started', 'go_completed', 'go_rider_cancelled',
      'go_cancelled', 'go_low_rating', 'go_review', 'go_message',
      'birthday', 'partner_review', 'membership_review'
    )
    and coalesce(n.body, '') !~* 'urgent harassment|started following|commented on your|liked your|reacted to your message'
    and n.kind is distinct from 'emergency_alert'
  order by n.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

revoke all on function public.list_inbox_notifications(integer) from public, anon;
grant execute on function public.list_inbox_notifications(integer) to authenticated;

-- Social activity no longer reaches the inbox. The underlying tables stay.
create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin return new; end $$;

create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin return new; end $$;

create or replace function public.notify_on_post_like()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin return new; end $$;

create or replace function public.notify_on_message()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin return new; end $$;

create or replace function public.notify_on_message_reaction()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin return new; end $$;

revoke all on function public.notify_on_follow() from public, anon, authenticated;
revoke all on function public.notify_on_comment() from public, anon, authenticated;
revoke all on function public.notify_on_post_like() from public, anon, authenticated;
revoke all on function public.notify_on_message() from public, anon, authenticated;
revoke all on function public.notify_on_message_reaction() from public, anon, authenticated;

create or replace function public.go_admin_review(p_application_id uuid, p_status text, p_notes text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  app public.go_applications;
  note text := nullif(btrim(left(coalesce(p_notes, ''), 500)), '');
  body text;
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_status not in ('approved', 'rejected', 'suspended', 'pending') then
    raise exception 'Invalid status';
  end if;
  if p_status in ('rejected', 'suspended') and char_length(coalesce(note, '')) < 2 then
    raise exception 'Write a short reason before rejecting';
  end if;

  select * into app from public.go_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found'; end if;

  update public.go_applications
  set status = p_status,
      admin_notes = note,
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id;

  if p_status in ('rejected', 'suspended') and app.role = 'rider' then
    update public.go_rider_state set is_online = false where user_id = app.user_id;
  end if;

  body := case
    when app.role = 'passenger' and p_status = 'approved' then 'approved your booking access. You can book rides now.'
    when app.role = 'passenger' and p_status = 'rejected' then 'did not approve booking yet. ' || note
    when app.role = 'rider' and p_status = 'approved' then 'approved your captain application. You can go online.'
    when app.role = 'rider' and p_status = 'rejected' then 'did not approve your captain application. ' || note
    when p_status = 'suspended' then 'suspended your SheRides access. ' || note
    else 'moved your SheRides application back to review.'
  end;

  perform public.notify_member(
    app.user_id, (select auth.uid()), 'go_review', body, '/go'
  );
end;
$$;

revoke all on function public.go_admin_review(uuid, text, text) from public, anon;
grant execute on function public.go_admin_review(uuid, text, text) to authenticated;

create or replace function public.admin_review_partner_application(
  p_id uuid,
  p_status text,
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  lead_phone text;
  target uuid;
  note text := nullif(btrim(left(coalesce(p_notes, ''), 500)), '');
  body text;
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Invalid status';
  end if;
  if p_status = 'rejected' and char_length(coalesce(note, '')) < 2 then
    raise exception 'Write a short reason before rejecting';
  end if;

  update public.partner_applications
  set status = p_status,
      admin_notes = note,
      reviewed_by = (select auth.uid()),
      reviewed_at = now()
  where id = p_id
  returning phone into lead_phone;

  if not found then
    raise exception 'Application not found';
  end if;

  -- Partner leads have no login of their own. Notify the member who signed up with the same mobile.
  select mp.user_id into target
  from public.member_phones mp
  where mp.phone = lead_phone
  limit 1;

  if target is not null then
    body := case p_status
      when 'approved' then 'approved your partner application. SheRides will contact you about next steps.'
      when 'rejected' then 'did not approve your partner application. ' || coalesce(note, '')
      else 'moved your partner application back to review.'
    end;
    perform public.notify_member(target, (select auth.uid()), 'partner_review', body, '/partner');
  end if;
end;
$$;

revoke all on function public.admin_review_partner_application(uuid, text, text) from public, anon;
grant execute on function public.admin_review_partner_application(uuid, text, text) to authenticated;

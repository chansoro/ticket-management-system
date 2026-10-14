-- Midterm Features Migration:
-- 1. Resolution comments on tickets (required when resolving, visible to Requestor)
-- 2. Role/Developer switch verification audit log
-- 3. Updated prepare_ticket() and create_ticket_notifications() triggers

alter table public.tickets
  add column if not exists resolution_comment text;

create table if not exists public.role_change_logs (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  changed_by uuid not null references public.profiles(id) on delete cascade,
  old_role public.user_role not null,
  new_role public.user_role not null,
  old_department_id uuid references public.departments(id) on delete set null,
  new_department_id uuid references public.departments(id) on delete set null,
  reason text not null default '',
  verified_method text not null default 'password_reauth',
  created_at timestamptz not null default now()
);

alter table public.role_change_logs enable row level security;
grant select, insert on public.role_change_logs to authenticated;

drop policy if exists role_change_logs_admin_policy on public.role_change_logs;
create policy role_change_logs_admin_policy
on public.role_change_logs for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Update prepare_ticket() so developers & admins can save resolution_comment when marking resolved
create or replace function public.prepare_ticket()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assignee_role public.user_role;
  assignee_department uuid;
  assignee_active boolean;
  category_department uuid;
  category_active boolean;
begin
  if tg_op = 'INSERT' then
    new.ticket_number := 'TKT-' || nextval('public.ticket_number_seq')::text;

    if auth.uid() is not null and not public.is_admin() then
      if public.current_user_role() <> 'user' then
        raise exception 'Only users and administrators may create tickets';
      end if;
      new.requestor_id := auth.uid();
      new.assigned_to := null;
      new.status := 'open';
      new.resolved_at := null;
      new.resolution_comment := null;
    end if;
  else
    new.ticket_number := old.ticket_number;
    new.requestor_id := old.requestor_id;

    if auth.uid() is not null and public.current_user_role() = 'developer' then
      if old.assigned_to is distinct from auth.uid() then
        raise exception 'Developers may only update tickets assigned to them';
      end if;
      if new.subject is distinct from old.subject
        or new.description is distinct from old.description
        or new.category_id is distinct from old.category_id
        or new.priority is distinct from old.priority
        or new.assigned_to is distinct from old.assigned_to then
        raise exception 'Developers may only change ticket status and resolution comment';
      end if;
    end if;

    if new.status is distinct from old.status and not (
      (old.status = 'open' and new.status = 'in_progress')
      or (old.status = 'in_progress' and new.status = 'resolved')
      or (old.status = 'open' and new.status = 'resolved' and public.is_admin())
      or (old.status = 'in_progress' and new.status = 'open' and public.is_admin() and new.assigned_to is null)
      or (old.status = 'resolved' and new.status = 'open' and public.is_admin())
    ) then
      raise exception 'Invalid ticket status transition from % to %', old.status, new.status;
    end if;
  end if;

  if new.status = 'resolved' and (tg_op = 'INSERT' or old.status is distinct from 'resolved') then
    if new.resolution_comment is null or btrim(new.resolution_comment) = '' then
      raise exception 'A resolution comment is required when marking a ticket as resolved';
    end if;
    new.resolved_at := now();
  elsif new.status <> 'resolved' then
    new.resolved_at := null;
    new.resolution_comment := null;
  end if;

  select department_id, is_active
    into category_department, category_active
    from public.categories
    where id = new.category_id;

  if category_department is null then
    raise exception 'Ticket category does not exist';
  end if;

  if tg_op = 'INSERT'
    and auth.uid() is not null
    and not public.is_admin()
    and not category_active then
    raise exception 'New tickets require an active category';
  end if;

  if new.assigned_to is not null then
    select role, department_id, is_active
      into assignee_role, assignee_department, assignee_active
      from public.profiles
      where id = new.assigned_to;

    if assignee_role is distinct from 'developer'
      or not coalesce(assignee_active, false)
      or assignee_department is distinct from category_department then
      raise exception 'Assignee must be an active developer from the ticket department';
    end if;
  end if;

  if new.status = 'in_progress' and new.assigned_to is null then
    raise exception 'Assigned status requires an assigned developer';
  end if;

  return new;
end;
$$;

-- Include resolution comment inside Requestor notification when resolved
create or replace function public.create_ticket_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  res_note text;
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (recipient_id, ticket_id, title, body)
    values (
      new.requestor_id,
      new.id,
      'Ticket submitted',
      '#' || new.ticket_number || ' was submitted successfully.'
    );

    insert into public.notifications (recipient_id, ticket_id, title, body)
    select p.id, new.id, 'New ticket submitted',
      '#' || new.ticket_number || ' has been submitted and is awaiting assignment.'
    from public.profiles p
    where p.role = 'admin'
      and p.is_active
      and p.id <> new.requestor_id;

    insert into public.notifications (recipient_id, ticket_id, title, body)
    select p.id, new.id, 'New ticket awaiting assignment',
      '#' || new.ticket_number || ' was submitted to your department.'
    from public.profiles p
    join public.categories c on c.id = new.category_id
    where p.role = 'developer'
      and p.is_active
      and p.department_id = c.department_id
      and p.id <> new.requestor_id;

    return new;
  end if;

  if new.assigned_to is distinct from old.assigned_to then
    if new.assigned_to is not null then
      insert into public.notifications (recipient_id, ticket_id, title, body)
      values (
        new.assigned_to,
        new.id,
        'New ticket assigned to you',
        '#' || new.ticket_number || ' has been assigned to you.'
      );

      if new.requestor_id <> new.assigned_to then
        insert into public.notifications (recipient_id, ticket_id, title, body)
        select new.requestor_id, new.id, 'Your ticket has been assigned',
          '#' || new.ticket_number || ' has been assigned to ' || p.full_name || '.'
        from public.profiles p where p.id = new.assigned_to;
      end if;
    else
      insert into public.notifications (recipient_id, ticket_id, title, body)
      values (
        new.requestor_id,
        new.id,
        'Your ticket is unassigned',
        '#' || new.ticket_number || ' is awaiting assignment.'
      );
    end if;
  end if;

  if new.status is distinct from old.status then
    res_note := case
      when new.status = 'resolved' and new.resolution_comment is not null and btrim(new.resolution_comment) <> ''
      then ' Resolution: ' || new.resolution_comment
      else ''
    end;

    insert into public.notifications (recipient_id, ticket_id, title, body)
    values (
      new.requestor_id,
      new.id,
      case when new.status = 'resolved' then 'Ticket resolved' else 'Ticket status updated' end,
      '#' || new.ticket_number || ' is now ' || replace(new.status::text, '_', ' ') || '.' || res_note
    );

    if new.assigned_to is not null and new.assigned_to <> new.requestor_id then
      insert into public.notifications (recipient_id, ticket_id, title, body)
      values (
        new.assigned_to,
        new.id,
        case when new.status = 'resolved' then 'Assigned ticket resolved' else 'Assigned ticket status updated' end,
        '#' || new.ticket_number || ' is now ' || replace(new.status::text, '_', ' ') || '.' || res_note
      );
    end if;

    insert into public.notifications (recipient_id, ticket_id, title, body)
    select p.id,
      new.id,
      case when new.status = 'resolved' then 'Ticket resolved' else 'Ticket status updated' end,
      '#' || new.ticket_number || ' is now ' || replace(new.status::text, '_', ' ') || '.' || res_note
    from public.profiles p
    where p.role = 'admin'
      and p.is_active
      and p.id <> new.requestor_id
      and (new.assigned_to is null or p.id <> new.assigned_to);
  end if;

  return new;
end;
$$;
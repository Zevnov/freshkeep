-- Run in Supabase SQL editor to add a server-side rate limit for item writes.
-- This limits authenticated users to 60 item inserts/updates per rolling minute.

create table if not exists public.item_write_audit (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists item_write_audit_user_created_at_idx
  on public.item_write_audit (user_id, created_at desc);

alter table public.item_write_audit enable row level security;

create or replace function public.enforce_item_write_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  recent_count int;
begin
  if uid is null then
    return new;
  end if;

  delete from public.item_write_audit
  where user_id = uid
    and created_at < now() - interval '1 day';

  select count(*)::int into recent_count
  from public.item_write_audit
  where user_id = uid
    and created_at >= now() - interval '1 minute';

  if recent_count >= 60 then
    raise exception 'Too many item changes. Please wait a minute and try again.';
  end if;

  insert into public.item_write_audit (user_id) values (uid);

  return new;
end;
$$;

drop trigger if exists items_rate_limit_write on public.items;
create trigger items_rate_limit_write
  before insert or update on public.items
  for each row execute function public.enforce_item_write_rate_limit();

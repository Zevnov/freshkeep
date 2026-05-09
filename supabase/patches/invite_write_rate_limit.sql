-- Run in Supabase SQL editor to add a server-side rate limit for invite creation.
-- This limits authenticated users to 10 invite-code creations per rolling hour.

create table if not exists public.invite_write_audit (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists invite_write_audit_user_created_at_idx
  on public.invite_write_audit (user_id, created_at desc);

alter table public.invite_write_audit enable row level security;

create or replace function public.enforce_invite_write_rate_limit()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  recent_count int;
begin
  if uid is null then
    return;
  end if;

  delete from public.invite_write_audit
  where user_id = uid
    and created_at < now() - interval '7 days';

  select count(*)::int into recent_count
  from public.invite_write_audit
  where user_id = uid
    and created_at >= now() - interval '1 hour';

  if recent_count >= 10 then
    raise exception 'Too many invite codes created. Please wait a bit and try again.';
  end if;

  insert into public.invite_write_audit (user_id) values (uid);
end;
$$;

create or replace function public.create_household_invite()
returns table (code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  new_code text;
  exp timestamptz;
begin
  select p.household_id into hid from public.profiles p where p.id = auth.uid();
  if hid is null then
    raise exception 'no_household';
  end if;
  if not exists (
    select 1 from public.household_members hm
    where hm.household_id = hid and hm.user_id = auth.uid()
  ) then
    raise exception 'not_a_member';
  end if;

  perform public.enforce_invite_write_rate_limit();

  perform 1
  from public.households
  where id = hid
  for update;

  update public.household_invites
  set revoked_at = now()
  where household_id = hid
    and revoked_at is null;

  new_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
  exp := now() + interval '7 days';
  insert into public.household_invites (household_id, code, expires_at, revoked_at, created_by)
  values (hid, new_code, exp, null, auth.uid());

  return query select new_code, exp;
end;
$$;

grant execute on function public.create_household_invite() to authenticated;

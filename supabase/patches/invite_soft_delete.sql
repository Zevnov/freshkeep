-- Run in Supabase SQL editor to switch invites to soft-delete semantics
-- and serialize invite creation per household.

alter table public.household_invites
  add column if not exists revoked_at timestamptz;

create unique index if not exists household_invites_one_active_per_household_idx
  on public.household_invites (household_id)
  where revoked_at is null;

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

create or replace function public.join_household(invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.household_invites%rowtype;
  uid uuid := auth.uid();
  norm text;
  old_hid uuid;
  member_count int;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  norm := upper(replace(replace(trim(both from invite_code), '-', ''), ' ', ''));
  if norm is null or norm !~ '^[A-F0-9]{8}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_or_expired_code');
  end if;

  select * into inv
  from public.household_invites
  where code = norm
    and revoked_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_or_expired_code');
  end if;

  if exists (
    select 1 from public.household_members m
    where m.household_id = inv.household_id and m.user_id = uid
  ) then
    return jsonb_build_object('ok', true, 'already_member', true, 'household_id', inv.household_id);
  end if;

  select household_id into old_hid from public.profiles where id = uid;

  if old_hid is not null and old_hid <> inv.household_id then
    select count(*)::int into member_count from public.household_members where household_id = old_hid;
    if member_count = 1 then
      if exists (
        select 1 from public.items i
        where i.household_id = old_hid and i.status = 'active'
      ) then
        return jsonb_build_object(
          'ok', false,
          'error', 'solo_household_has_active_items'
        );
      end if;
    end if;
  end if;

  delete from public.household_members where user_id = uid;

  update public.profiles
  set household_id = inv.household_id, updated_at = now()
  where id = uid;

  insert into public.household_members (household_id, user_id, role)
  values (inv.household_id, uid, 'member');

  return jsonb_build_object('ok', true, 'household_id', inv.household_id);
end;
$$;

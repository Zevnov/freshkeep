-- Fix HTTP 500 on REST requests that touch RLS involving household_members.
-- Cause: members_select referenced household_members inside a subquery on household_members,
-- which can trigger "infinite recursion detected in policy" in PostgreSQL.
--
-- Run once in Supabase SQL Editor (Dashboard → SQL → New query).

create or replace function public.user_household_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select household_id
  from public.household_members
  where user_id = auth.uid();
$$;

revoke all on function public.user_household_ids() from public;
grant execute on function public.user_household_ids() to authenticated;

drop policy if exists households_select on public.households;
create policy households_select on public.households
  for select to authenticated
  using (id in (select public.user_household_ids()));

drop policy if exists members_select on public.household_members;
create policy members_select on public.household_members
  for select to authenticated
  using (household_id in (select public.user_household_ids()));

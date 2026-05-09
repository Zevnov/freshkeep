-- Run in Supabase SQL editor to enforce item-name validation at the database layer.
-- This limits names to 120 characters and rejects whitespace-only/invisible-only names.

create or replace function public.is_valid_item_name(raw_name text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select raw_name is not null
    and char_length(raw_name) <= 120
    and char_length(
      regexp_replace(
        regexp_replace(btrim(raw_name), '[[:space:]]', '', 'g'),
        '[' || chr(8203) || chr(8204) || chr(8205) || chr(8288) || chr(65279) || ']',
        '',
        'g'
      )
    ) > 0;
$$;

alter table public.items drop constraint if exists items_name_valid_check;
alter table public.items
  add constraint items_name_valid_check
  check (public.is_valid_item_name(name));

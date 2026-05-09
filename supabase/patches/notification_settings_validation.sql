-- Run in Supabase SQL editor to enforce validation for profiles.notification_settings.
-- This blocks malformed JSON and out-of-range values like digestHour = 999.

create or replace function public.is_valid_notification_settings(raw jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    jsonb_typeof(raw) = 'object'
    and (
      not (raw ? 'masterEnabled')
      or jsonb_typeof(raw->'masterEnabled') = 'boolean'
    )
    and (
      not (raw ? 'notificationStyle')
      or (raw->>'notificationStyle') in ('individual', 'digest')
    )
    and (
      not (raw ? 'notifySoon')
      or jsonb_typeof(raw->'notifySoon') = 'boolean'
    )
    and (
      not (raw ? 'notifyToday')
      or jsonb_typeof(raw->'notifyToday') = 'boolean'
    )
    and (
      not (raw ? 'notifyOverdue')
      or jsonb_typeof(raw->'notifyOverdue') = 'boolean'
    )
    and (
      not (raw ? 'includeMine')
      or jsonb_typeof(raw->'includeMine') = 'boolean'
    )
    and (
      not (raw ? 'defaultSoonDays')
      or (
        jsonb_typeof(raw->'defaultSoonDays') = 'number'
        and (raw->>'defaultSoonDays')::int between 1 and 30
      )
    )
    and (
      not (raw ? 'soonHour')
      or (
        jsonb_typeof(raw->'soonHour') = 'number'
        and (raw->>'soonHour')::int between 0 and 23
      )
    )
    and (
      not (raw ? 'todayHour')
      or (
        jsonb_typeof(raw->'todayHour') = 'number'
        and (raw->>'todayHour')::int between 0 and 23
      )
    )
    and (
      not (raw ? 'overdueHour')
      or (
        jsonb_typeof(raw->'overdueHour') = 'number'
        and (raw->>'overdueHour')::int between 0 and 23
      )
    )
    and (
      not (raw ? 'digestHour')
      or (
        jsonb_typeof(raw->'digestHour') = 'number'
        and (raw->>'digestHour')::int between 0 and 23
      )
    )
    and (
      not (raw ? 'digestMinute')
      or (
        jsonb_typeof(raw->'digestMinute') = 'number'
        and (raw->>'digestMinute')::int between 0 and 59
      )
    );
$$;

alter table public.profiles drop constraint if exists profiles_notification_settings_valid_check;
alter table public.profiles
  add constraint profiles_notification_settings_valid_check
  check (public.is_valid_notification_settings(notification_settings));

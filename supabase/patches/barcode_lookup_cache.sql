-- Run in Supabase SQL editor to support the barcode lookup edge function cache.

create table if not exists public.barcode_lookup_cache (
  barcode text primary key,
  response jsonb not null,
  source text not null default 'open_food_facts',
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists barcode_lookup_cache_expires_at_idx
  on public.barcode_lookup_cache (expires_at);

alter table public.barcode_lookup_cache enable row level security;

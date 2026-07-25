-- Run this in Supabase → SQL Editor
-- Then enable Realtime for the `wishes` table (Database → Replication)

create extension if not exists "pgcrypto";

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  type text not null default 'place',
  location_name text,
  lat double precision,
  lng double precision,
  day_id text,
  sort_order integer not null default 0,
  active boolean not null default true,
  meta jsonb not null default '[]'::jsonb,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- If you already created the table earlier, run:
-- alter table public.wishes add column if not exists meta jsonb not null default '[]'::jsonb;
-- alter table public.wishes add column if not exists items jsonb not null default '[]'::jsonb;
-- alter table public.wishes add column if not exists active boolean not null default true;

create index if not exists wishes_day_id_idx on public.wishes (day_id);
create index if not exists wishes_sort_idx on public.wishes (sort_order);

alter table public.wishes enable row level security;

drop policy if exists "Allow public read wishes" on public.wishes;
drop policy if exists "Allow public insert wishes" on public.wishes;
drop policy if exists "Allow public update wishes" on public.wishes;
drop policy if exists "Allow public delete wishes" on public.wishes;

create policy "Allow public read wishes"
  on public.wishes for select using (true);

create policy "Allow public insert wishes"
  on public.wishes for insert with check (true);

create policy "Allow public update wishes"
  on public.wishes for update using (true);

create policy "Allow public delete wishes"
  on public.wishes for delete using (true);

-- Shopping buy-list (synced) — enable Realtime for `shopping` too
create table if not exists public.shopping (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  place text,
  lat double precision,
  lng double precision,
  done boolean not null default false,
  from_wish_id uuid,
  created_at timestamptz not null default now()
);

alter table public.shopping enable row level security;

drop policy if exists "Allow public read shopping" on public.shopping;
drop policy if exists "Allow public insert shopping" on public.shopping;
drop policy if exists "Allow public update shopping" on public.shopping;
drop policy if exists "Allow public delete shopping" on public.shopping;

create policy "Allow public read shopping"
  on public.shopping for select using (true);

create policy "Allow public insert shopping"
  on public.shopping for insert with check (true);

create policy "Allow public update shopping"
  on public.shopping for update using (true);

create policy "Allow public delete shopping"
  on public.shopping for delete using (true);

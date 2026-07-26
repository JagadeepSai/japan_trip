-- Upgrade for projects seeded before 2026-07-26:
-- adds the shared `settings` table (trip dates sync) and the per-user
-- `user_settings` table (chat key sync via Google sign-in).
-- Run once in Supabase → SQL Editor. Then enable Realtime for `settings`.
-- (Event images/durations backfill automatically the first time the app loads.)

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

drop policy if exists "Allow public read settings" on public.settings;
drop policy if exists "Allow public insert settings" on public.settings;
drop policy if exists "Allow public update settings" on public.settings;
drop policy if exists "Allow public delete settings" on public.settings;

create policy "Allow public read settings" on public.settings for select using (true);
create policy "Allow public insert settings" on public.settings for insert with check (true);
create policy "Allow public update settings" on public.settings for update using (true);
create policy "Allow public delete settings" on public.settings for delete using (true);

insert into public.settings (key, value)
select 'trip-dates', '{"start":"2026-10-15","end":"2026-10-26"}'::jsonb
where not exists (select 1 from public.settings where key = 'trip-dates');

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "Own settings only" on public.user_settings;

create policy "Own settings only"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

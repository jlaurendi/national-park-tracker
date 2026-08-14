-- Park Tracker phase 2: per-user tables mirroring src/types/domain.ts.
-- Conventions: snake_case columns (mapped to camelCase in the app layer),
-- client-generated UUID ids, client-managed created_at/updated_at (the app is
-- the source of truth so records survive local→cloud migration unchanged),
-- calendar dates as `date` (PostgREST serializes them as 'YYYY-MM-DD').

create table public.visits (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  park_id text not null,
  start_date date not null,
  end_date date,
  rating smallint check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table public.trips (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  notes text,
  status text not null check (status in ('idea', 'scheduled', 'completed')),
  start_date date,
  end_date date,
  -- Embedded ordered stops, exactly as the app models them. Normalize to a
  -- child table only if cross-user querying ever needs it.
  stops jsonb not null default '[]'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table public.goals (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('all-parks', 'park-count', 'park-list')),
  name text not null,
  target_count integer,
  park_ids jsonb,
  target_date date,
  achieved_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table public.earned_badges (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (user_id, badge_id)
);

create table public.photos (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  visit_id uuid not null references public.visits (id) on delete cascade,
  park_id text not null,
  caption text,
  taken_on date,
  width integer not null,
  height integer not null,
  mime_type text not null default 'image/jpeg',
  size_bytes integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index visits_user_idx on public.visits (user_id);
create index trips_user_idx on public.trips (user_id);
create index goals_user_idx on public.goals (user_id);
create index earned_badges_user_idx on public.earned_badges (user_id);
create index photos_user_idx on public.photos (user_id);
create index photos_visit_idx on public.photos (visit_id);

-- Row-level security: users touch only their own rows.
alter table public.visits enable row level security;
alter table public.trips enable row level security;
alter table public.goals enable row level security;
alter table public.earned_badges enable row level security;
alter table public.photos enable row level security;

create policy "own visits" on public.visits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own trips" on public.trips
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own goals" on public.goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own earned_badges" on public.earned_badges
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own photos" on public.photos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Base table privileges for signed-in users (RLS then restricts to own rows).
-- Explicit grants so the schema doesn't depend on platform default privileges.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.visits to authenticated;
grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update, delete on public.earned_badges to authenticated;
grant select, insert, update, delete on public.photos to authenticated;

-- Private bucket for photo binaries; paths are <user_id>/<photo_id>/<variant>.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg']);

create policy "own photo objects select" on storage.objects
  for select using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photo objects insert" on storage.objects
  for insert with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photo objects update" on storage.objects
  for update using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own photo objects delete" on storage.objects
  for delete using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

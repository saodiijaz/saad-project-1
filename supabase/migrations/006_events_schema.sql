-- BRIEF-DB-002: Events schema

create table public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  created_by uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  max_attendees int,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create index events_club_idx on public.events(club_id);
create index events_starts_idx on public.events(starts_at);

create policy "Anyone can read public events"
  on public.events for select
  using (is_public = true);

create policy "Authenticated users can create events"
  on public.events for insert
  with check (auth.uid() = created_by);

create policy "Creators can update own events"
  on public.events for update
  using (auth.uid() = created_by);

create policy "Creators can delete own events"
  on public.events for delete
  using (auth.uid() = created_by);

-- Event attendees
create table public.event_attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'maybe', 'declined')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.event_attendees enable row level security;

create policy "Anyone can read attendees of public events"
  on public.event_attendees for select
  using (
    exists (select 1 from public.events where id = event_attendees.event_id and is_public)
  );

create policy "Users can join events"
  on public.event_attendees for insert
  with check (auth.uid() = user_id);

create policy "Users can update own attendance"
  on public.event_attendees for update
  using (auth.uid() = user_id);

create policy "Users can leave events"
  on public.event_attendees for delete
  using (auth.uid() = user_id);

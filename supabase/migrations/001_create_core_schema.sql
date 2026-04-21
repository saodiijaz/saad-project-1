-- BRIEF-DB-001: Core schema for SportMeet MVP
-- Creates 7 tables with RLS enabled

-- ==========================================
-- USERS
-- Mirrors auth.users with app-specific fields
-- ==========================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  avatar_url text,
  city text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read any user"
  on public.users for select
  using (true);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- ==========================================
-- SPORTS
-- Categories for filtering (football, hockey, etc.)
-- ==========================================
create table public.sports (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

alter table public.sports enable row level security;

create policy "Anyone can read sports"
  on public.sports for select
  using (true);

-- ==========================================
-- CLUBS
-- Sports clubs / associations
-- ==========================================
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  logo_url text,
  cover_url text,
  city text not null,
  website text,
  contact_email text,
  created_at timestamptz not null default now()
);

alter table public.clubs enable row level security;

create index clubs_city_idx on public.clubs(city);
create index clubs_slug_idx on public.clubs(slug);

create policy "Anyone can read clubs"
  on public.clubs for select
  using (true);

-- Club updates require membership with admin role (enforced via club_members)
create policy "Club admins can update"
  on public.clubs for update
  using (
    exists (
      select 1 from public.club_members
      where club_id = clubs.id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- ==========================================
-- CLUB_SPORTS
-- Many-to-many: clubs offer multiple sports
-- ==========================================
create table public.club_sports (
  club_id uuid not null references public.clubs(id) on delete cascade,
  sport_id uuid not null references public.sports(id) on delete cascade,
  primary key (club_id, sport_id)
);

alter table public.club_sports enable row level security;

create policy "Anyone can read club_sports"
  on public.club_sports for select
  using (true);

-- ==========================================
-- CLUB_MEMBERS
-- Who represents which club (admin / editor)
-- Assigned manually for MVP
-- ==========================================
create table public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

alter table public.club_members enable row level security;

create index club_members_user_idx on public.club_members(user_id);
create index club_members_club_idx on public.club_members(club_id);

create policy "Members can read own memberships"
  on public.club_members for select
  using (user_id = auth.uid());

-- Admins of a club can read all members of that club
create policy "Club admins can read club members"
  on public.club_members for select
  using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = club_members.club_id
        and cm.user_id = auth.uid()
        and cm.role = 'admin'
    )
  );

-- ==========================================
-- CLUB_POSTS
-- Posts by clubs (for the feed)
-- ==========================================
create table public.club_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  title text not null,
  body text not null default '',
  image_url text,
  event_at timestamptz,
  location text,
  created_at timestamptz not null default now()
);

alter table public.club_posts enable row level security;

create index club_posts_club_idx on public.club_posts(club_id);
create index club_posts_created_idx on public.club_posts(created_at desc);

create policy "Anyone can read club posts"
  on public.club_posts for select
  using (true);

create policy "Club members can insert posts"
  on public.club_posts for insert
  with check (
    exists (
      select 1 from public.club_members
      where club_id = club_posts.club_id
        and user_id = auth.uid()
        and role in ('admin', 'editor')
    )
  );

create policy "Club members can update posts"
  on public.club_posts for update
  using (
    exists (
      select 1 from public.club_members
      where club_id = club_posts.club_id
        and user_id = auth.uid()
        and role in ('admin', 'editor')
    )
  );

create policy "Club admins can delete posts"
  on public.club_posts for delete
  using (
    exists (
      select 1 from public.club_members
      where club_id = club_posts.club_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- ==========================================
-- FOLLOWS
-- User follows a club
-- ==========================================
create table public.follows (
  user_id uuid not null references public.users(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, club_id)
);

alter table public.follows enable row level security;

create index follows_club_idx on public.follows(club_id);

create policy "Users can read own follows"
  on public.follows for select
  using (user_id = auth.uid());

create policy "Anyone can read follow counts"
  on public.follows for select
  using (true);

create policy "Users can follow"
  on public.follows for insert
  with check (user_id = auth.uid());

create policy "Users can unfollow"
  on public.follows for delete
  using (user_id = auth.uid());

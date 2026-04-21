-- BRIEF-DB-005: User posts (personal feed posts)

create table public.user_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.user_posts enable row level security;

create index user_posts_author_idx on public.user_posts(author_id);
create index user_posts_created_idx on public.user_posts(created_at desc);

-- Anyone authenticated can read
create policy "Anyone can read user posts"
  on public.user_posts for select
  to authenticated
  using (true);

-- Only author can insert
create policy "Users can create own posts"
  on public.user_posts for insert
  with check (auth.uid() = author_id);

-- Only author can update/delete
create policy "Users can update own posts"
  on public.user_posts for update
  using (auth.uid() = author_id);

create policy "Users can delete own posts"
  on public.user_posts for delete
  using (auth.uid() = author_id);

-- Storage bucket for user post images
-- RUN MANUALLY IN DASHBOARD: create bucket 'user-posts' (public read, authenticated write, 5MB, image/*)

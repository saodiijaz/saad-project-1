# BRIEF-DB-006: Kommentarer + likes — databas-schema

## Mål
Stöd för kommentarer och likes på både `club_posts` OCH `user_posts` via polymorphism (post_type-kolumn).

## Berörda filer
- `supabase/migrations/011_comments_likes_schema.sql` — ny

## Steg

Skapa `supabase/migrations/011_comments_likes_schema.sql`:

```sql
-- BRIEF-DB-006: Comments and likes for club_posts + user_posts

-- Comments
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_type text not null check (post_type in ('club', 'user')),
  post_id uuid not null,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) > 0 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

alter table public.post_comments enable row level security;

create index post_comments_lookup_idx on public.post_comments(post_type, post_id, created_at desc);
create index post_comments_author_idx on public.post_comments(author_id);

create policy "Anyone authenticated can read comments"
  on public.post_comments for select
  to authenticated using (true);

create policy "Users can comment"
  on public.post_comments for insert
  with check (auth.uid() = author_id);

create policy "Users can delete own comments"
  on public.post_comments for delete
  using (auth.uid() = author_id);

-- Likes
create table public.post_likes (
  post_type text not null check (post_type in ('club', 'user')),
  post_id uuid not null,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_type, post_id, user_id)
);

alter table public.post_likes enable row level security;

create index post_likes_lookup_idx on public.post_likes(post_type, post_id);

create policy "Anyone authenticated can read likes"
  on public.post_likes for select
  to authenticated using (true);

create policy "Users can like"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike"
  on public.post_likes for delete
  using (auth.uid() = user_id);
```

## Verifiering
- [ ] Fil skapad i `supabase/migrations/011_comments_likes_schema.sql`
- [ ] `pnpm typecheck` grönt

## Anti-patterns
- Skapa INTE separata `club_post_comments` + `user_post_comments` — polymorphism i en tabell är enklare
- Glöm INTE character length check — förhindra spam

## Commit
`BRIEF-DB-006: Post comments and likes schema`

## Rollback
```bash
git rm supabase/migrations/011_comments_likes_schema.sql
```

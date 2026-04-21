-- Migration 013 — content reports for moderation
-- Idempotent: använder IF NOT EXISTS / DO blocks så det går att köra om.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'report_reason') then
    create type report_reason as enum ('spam', 'harassment', 'nudity', 'violence', 'other');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type report_status as enum ('pending', 'reviewed', 'dismissed', 'actioned');
  end if;
end $$;

create table if not exists post_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_type text not null check (post_type in ('club', 'user')),
  post_id uuid not null,
  reason report_reason not null,
  note text,
  status report_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists post_reports_post_idx on post_reports(post_type, post_id);
create index if not exists post_reports_status_idx on post_reports(status);

-- Frivillig: hindra dubbelrapportering från samma user på samma post
create unique index if not exists post_reports_unique_per_user
  on post_reports(reporter_id, post_type, post_id);

alter table post_reports enable row level security;

drop policy if exists "own_reports_read" on post_reports;
create policy "own_reports_read" on post_reports for select
  using (reporter_id = auth.uid());

drop policy if exists "any_logged_in_can_insert" on post_reports;
create policy "any_logged_in_can_insert" on post_reports for insert
  with check (reporter_id = auth.uid());

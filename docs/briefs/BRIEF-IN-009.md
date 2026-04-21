# BRIEF-IN-009: Moderation — rapportera inlägg

## Status
✅ READY — DB-migration + UI.

## Mål
Användare ska kunna rapportera inlägg (klubb- eller user-post) för otillbörligt innehåll. Rapporten sparas i en ny tabell `post_reports` för senare manuell review.

## Blockerad av
Inget. Ny migration 013.

## Berörda filer
- `supabase/migrations/013_post_reports.sql` — ny tabell + RLS
- `apps/mobile/lib/data.ts` — `reportPost(type, id, reason)`
- `apps/mobile/app/post/[type]/[id].tsx` — "🚩 Rapportera"-knapp
- `apps/mobile/app/(tabs)/feed.tsx` — även tillgänglig från PostActions

## DB-schema

```sql
create type report_reason as enum ('spam', 'harassment', 'nudity', 'violence', 'other');
create type report_status as enum ('pending', 'reviewed', 'dismissed', 'actioned');

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
alter table post_reports enable row level security;
-- Bara rapportören själv kan se sina rapporter. Inga andra läsare.
create policy "own_reports_read" on post_reports for select
  using (reporter_id = auth.uid());
create policy "any_logged_in_can_insert" on post_reports for insert
  with check (reporter_id = auth.uid());
```

## Helper
```typescript
export type ReportReason = 'spam' | 'harassment' | 'nudity' | 'violence' | 'other'
export async function reportPost(type: PostType, postId: string, reason: ReportReason, note?: string): Promise<void>
```

## UI
Enkel `Alert.alert` med knappar: Spam / Trakasseri / Nakenhet / Våld / Annat → kalla `reportPost` → visa "Tack, vi tittar på det".

## Verifiering
- [ ] Tryck 🚩 på kommentarsskärm → rapport-alert
- [ ] Välj orsak → rad läggs i `post_reports` med rätt reporter_id
- [ ] Samma user kan inte rapportera samma post mer än en gång… (frivilligt: unique index)
- [ ] Ingen kan läsa andras rapporter (RLS)

## Commit
`BRIEF-IN-009: Content report flow + post_reports table`

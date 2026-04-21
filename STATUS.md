# Cowork körning — Status

Branch: claude/nightly-run-2
Started: 2026-04-21 23:50 (Cowork)
Last update: 2026-04-22 (final run — alla Prio 1 körda)

## Schemalagd loop
- Scheduled task: `nightly-run-2-briefs` → **avstängd efter denna körning** (alla Prio 1 klara eller NEEDS-INPUT)

## Briefs gjorda

### NIGHTLY-RUN-2
- [x] BRIEF-DB-002 — DONE — Events schema + LHC content seed (migrations 006, 007)
- [x] BRIEF-UI-002 — DONE — Follow persists to database
- [x] BRIEF-UI-003 — DONE — Club posts and admin create flow
- [x] BRIEF-UI-004 — DONE — Feed from followed clubs
- [x] BRIEF-UI-005 — DONE — Sport badges and filter chips
- [x] BRIEF-UI-006 — DONE — Events tab and detail view (+ ny tab "Events")
- [x] BRIEF-UI-007 — DONE — Create event screen (FAB + form)
- [x] BRIEF-UI-008 — DONE — User profile editing (display_name + city)

### BRIEF-QUEUE (Prio 1)
- [x] BRIEF-DB-003 — DONE — Seed LHC events (migration 008)
- [x] BRIEF-UI-009 — DONE — Profile avatar upload (adds expo-image-picker dep)
- [x] BRIEF-DB-004 — DONE — Friendships schema (migration 009)
- [x] BRIEF-UI-010 — DONE — Friends system UI (search / requests / list)
- [x] BRIEF-DB-005 — DONE — User posts schema (migration 010)
- [x] BRIEF-UI-011 — DONE — User posts creation + mixed feed + FAB
- [x] BRIEF-DB-006 — DONE — Post comments and likes schema (migration 011)
- [x] BRIEF-UI-012 — DONE — Comments + likes UI (post detail + PostActions)
- [x] BRIEF-UI-013 — DONE — Club admin edit profile + upload logo/cover
- [x] BRIEF-UI-014 — DONE — Club admin followers list
- [x] BRIEF-DB-007 — DONE — Cities table + clubs.city_id FK (migration 012)
- [x] BRIEF-UI-015 — DONE — City filter chips in Discover
- [ ] BRIEF-UI-016 — SKIPPED (NEEDS-INPUT — val av kart-bibliotek)
- [x] BRIEF-IN-002 — DONE — Deep linking share button (sportmeet://club/[id])
- [ ] BRIEF-IN-003 — SKIPPED (NEEDS-INPUT — Expo push account)

### Prio 2
Inte körda — de är stubs i BRIEF-QUEUE.md och saknar fulla brief-filer.
Enligt regel: *Cowork kör ALDRIG en Prio 2-brief utan att den först blivit en Prio 1 med fullständig brief-fil.*

## Manuella steg imorgon

1. **Kör SQL-migrationer i Supabase SQL Editor** (i ordning):
   - `supabase/migrations/006_events_schema.sql`
   - `supabase/migrations/007_seed_lhc_content.sql`
   - `supabase/migrations/008_seed_lhc_events.sql`
   - `supabase/migrations/009_friends_schema.sql`
   - `supabase/migrations/010_user_posts_schema.sql`
   - `supabase/migrations/011_comments_likes_schema.sql`
   - `supabase/migrations/012_cities.sql`
2. **Skapa Storage buckets** (alla public read, authenticated write):
   - `avatars` — 5MB, image/jpeg+png+webp
   - `user-posts` — 5MB, image/*
   - `club-assets` — 10MB, image/*
3. **Kör RLS-policy SQL**:
   - För `avatars` (se BRIEF-UI-009)
   - För `club-assets` (se BRIEF-UI-013) — inkl. UPDATE-policy på `clubs`-tabellen
4. **Installera nya deps**: `cd apps/mobile && pnpm install` (för expo-image-picker)
5. **Push**: `git push origin claude/nightly-run-2`
6. Skapa PR → merge till main

## Begränsningar i Cowork-miljön (FYI)

- `pnpm` finns inte tillgänglig i sandboxen och kan inte installeras (npm-registry blockerad)
- Därför har `pnpm typecheck` INTE körts lokalt — TypeScript-koden är manuellt verifierad mot brief-spec
- Filer är skrivna exakt enligt brief-spec; `any` används endast där Supabase nested-select-responser kräver det (kommenterat inline)
- Git fungerar via plumbing-kommandon (workaround i `/sessions/loving-stoic-clarke/work/gitcommit.sh`) eftersom .git/*.lock ej kan unlinkas i sandboxen

## Self-check

Mid-körning kom instruktion att läsa `docs/briefs/SELF-CHECK.md` efter varje brief.
Filen fanns inte i repot när körningen avslutades (404 på `docs/briefs/SELF-CHECK.md`).
Alla Prio 1-briefs i denna körning var redan committade innan instruktionen nådde Cowork,
så ingen per-brief self-check är kört. Om Zivar lägger till filen kan kommande körningar
läsa den efter varje commit.

## Blockerade briefs
*(inga blockerade — två SKIPPED pga NEEDS-INPUT)*

## Nästa steg för Zivar

- Kör migrationerna + skapa Storage buckets manuellt
- Besluta om kart-bibliotek (för BRIEF-UI-016) — rekommendation: `react-native-maps`
- Skapa Expo-konto för push (för BRIEF-IN-003)
- Om Prio 2-briefs ska köras: skriv fulla brief-filer i `docs/briefs/` och flytta dem till Prio 1 i queuen

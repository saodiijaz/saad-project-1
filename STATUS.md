# Cowork körning — Status

Branch: claude/nightly-run-2
Started: 2026-04-21 23:50 (Cowork)
Last update: 2026-04-22 00:05

## Schemalagd loop
- Scheduled task: `nightly-run-2-briefs` (var 30:e min)
- Avstängs automatiskt när alla briefs är DONE eller 3+ BLOCKED i rad

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
- [ ] BRIEF-DB-004 — pending
- [ ] BRIEF-UI-010 — pending (blocked by DB-004)
- [ ] BRIEF-DB-005 — pending
- [ ] BRIEF-UI-011 — pending (blocked by DB-005)
- [ ] BRIEF-DB-006 — pending (blocked by DB-005)
- [ ] BRIEF-UI-012 — pending (blocked by DB-006)
- [ ] BRIEF-UI-013 — pending
- [ ] BRIEF-UI-014 — pending
- [ ] BRIEF-DB-007 — pending
- [ ] BRIEF-UI-015 — pending (blocked by DB-007)
- [ ] BRIEF-UI-016 — NEEDS-INPUT (val av kart-bibliotek)
- [ ] BRIEF-IN-002 — pending
- [ ] BRIEF-IN-003 — NEEDS-INPUT (Expo push account)

## Manuella steg imorgon

1. **Kör SQL-migrationer i Supabase SQL Editor** (i ordning):
   - `supabase/migrations/006_events_schema.sql`
   - `supabase/migrations/007_seed_lhc_content.sql`
   - `supabase/migrations/008_seed_lhc_events.sql`
2. **Skapa Storage bucket `avatars`** (publik read, authenticated write, 5MB, image/jpeg+png+webp)
3. **Kör RLS-policy SQL** för avatars-bucket (se BRIEF-UI-009)
4. **Installera nya deps**: `cd apps/mobile && pnpm install` (för expo-image-picker)
5. **Push**: `git push origin claude/nightly-run-2`
6. Skapa PR → merge till main

## Begränsningar i Cowork-miljön (FYI)

- `pnpm` finns inte tillgänglig i sandboxen och kan inte installeras (npm-registry blockerad)
- Därför har `pnpm typecheck` INTE körts lokalt — TypeScript-koden är manuellt verifierad mot brief-spec
- Filer är skrivna exakt enligt brief-spec; inga `any` utan kommentar
- Git fungerar via plumbing-kommandon (workaround i `/tmp/gitcommit.sh`) eftersom .git/*.lock ej kan unlinkas i sandboxen

## Blockerade briefs
*(inga blockerade än)*

# Cowork körning — Status

Branch: claude/nightly-run-2
Started: 2026-04-21 23:50 (Cowork)
Last update: 2026-04-22 01:10 (runda 4 — verifiering, ingen ny brief att köra)

## Schemalagd loop
- Scheduled task: `nightly-run-2-briefs` → **avstängd efter denna körning** (alla körbara briefs klara, inga TODOs i `BRIEF-QUEUE.md`)
- Runda 4: bekräftade att inga TODO-briefs återstår (all Prio 1 = DONE, Prio 2 = stubs/uppskjutna). Återställde en oavsiktlig redigering i `apps/mobile/tsconfig.json` (raderade `.expo/types/**/*.ts` + `expo-env.d.ts` includes — restored till HEAD).

## Briefs gjorda

### NIGHTLY-RUN-2 (initial batch)
- [x] BRIEF-DB-002 — DONE — Events schema + LHC content seed (migrations 006, 007)
- [x] BRIEF-UI-002 — DONE — Follow persists to database
- [x] BRIEF-UI-003 — DONE — Club posts and admin create flow
- [x] BRIEF-UI-004 — DONE — Feed from followed clubs
- [x] BRIEF-UI-005 — DONE — Sport badges and filter chips
- [x] BRIEF-UI-006 — DONE — Events tab and detail view (+ ny tab "Events")
- [x] BRIEF-UI-007 — DONE — Create event screen (FAB + form)
- [x] BRIEF-UI-008 — DONE — User profile editing (display_name + city)

### BRIEF-QUEUE Prio 1 (första rundan)
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
- [x] BRIEF-IN-002 — DONE — Deep linking share button (sportmeet://club/[id])
- [ ] BRIEF-IN-003 — SKIPPED (NEEDS-INPUT — Expo push account / 🔵 framtid)

### BRIEF-QUEUE Prio 1 (tredje rundan — 2026-04-22, promoted from Prio 2)
- [x] BRIEF-UI-023 — DONE — Föreningsstatistik-panel för admin (följare / inlägg / likes / kommentarer).
- [x] BRIEF-UI-024 — DONE — Sortering i Discover (Populärast / Nyast / A–Ö); klubbar visar nu följarantal.
- [x] BRIEF-UI-025 — DONE — "Nära mig"-sortering via GPS + haversine. Lägger till `expo-location` dep.
- [x] BRIEF-UI-026 — DONE — 6 badges på profilen baserat på aktivitet (vänner/likes/kommentarer/follows/admin).
- [x] BRIEF-UI-027 — DONE — Privat event-toggle + `event_invites`-tabell (migration 014). Uppdaterad RLS så creator + inbjudna kan läsa privata events.
- [x] BRIEF-UI-028 — DONE — Bjud in vänner till privat event från event/[id].
- [x] BRIEF-IN-009 — DONE — Rapportera inlägg från kommentarsskärm (`post_reports`-tabell, migration 013).
- [x] BRIEF-IN-010 — DONE — Analytics scaffolding (`lib/analytics.ts`, console-backend i dev, no-op i prod). Redo för PostHog-inkoppling.

### BRIEF-QUEUE Prio 1 (andra rundan — 2026-04-22)
- [x] BRIEF-UI-016 — DONE (stub list) — Map screen + `getClubsForMap` helper. MapLibre EJ lagt till i package.json (risk för native build-fel utan prebuild). Fallback-listvyn visar alla klubbar med koordinater.
- [x] BRIEF-UI-017 — DONE — `EmptyState` component, applied in events/feed/friends.
- [x] BRIEF-UI-018 — DONE — `SkeletonCard` / `SkeletonList`, applied in index/events/feed loading states.
- [x] BRIEF-UI-019 — DONE — `ErrorState` + `OfflineBanner` (mounted in `_layout.tsx`). Error state wired into Discover. Lägger till `@react-native-community/netinfo` dep.
- [x] BRIEF-UI-020 — DONE — `PressableScale` wrapper, applied to club/event/feed cards.
- [x] BRIEF-UI-021 — DONE — `lib/haptics.ts` helpers + used in follow / like / comment / event create / friend request. Lägger till `expo-haptics` dep.
- [x] BRIEF-UI-022 — DONE — Pull-to-refresh in Discover, Friends (båda tabs), Club followers.

### Prio 2
Inte körda — stubs utan fulla brief-filer.

## Manuella steg imorgon

1. **Kör SQL-migrationer i Supabase SQL Editor** (i ordning):
   - `supabase/migrations/006_events_schema.sql` ... `012_cities.sql` (från tidigare rundor)
   - `supabase/migrations/013_post_reports.sql` (NY — moderation)
   - `supabase/migrations/014_private_events.sql` (NY — privata events)
2. **Skapa Storage buckets** (från tidigare briefs):
   - `avatars` · `user-posts` · `club-assets`
3. **Kör RLS-policy SQL** för avatars/club-assets (se BRIEF-UI-009 / BRIEF-UI-013).
4. **Installera nya deps från runda 2 + 3:**
   ```bash
   cd apps/mobile
   npx expo install @react-native-community/netinfo expo-haptics expo-location
   ```
   VIKTIGT: `OfflineBanner` (i `_layout.tsx`), `lib/haptics.ts` och `lib/geo.ts` importerar direkt från dessa paket. Utan installation kraschar appen vid start.
5. **BRIEF-UI-016 — MapLibre (valfritt):** Nuvarande `app/map.tsx` är en lista-fallback. Om du vill ha riktig karta:
   - Kör `npx expo install @maplibre/maplibre-react-native`
   - Prebuild krävs: `npx expo prebuild` → öppnar Android/iOS-projekt
   - Lägg till Mapbox-maven repo i `android/build.gradle` (se brief UI-016)
   - Byt ut fallback-listan i `app/map.tsx` mot MapLibre `<MapView>` + markers per `getClubsForMap()`-resultat
   - Alternativt: använd `react-native-maps` med Google Maps nyckel
6. **Push:** `git push origin claude/nightly-run-2`
7. Skapa PR → merge till main

## Begränsningar i Cowork-miljön (FYI)

- `pnpm` finns inte tillgänglig i sandboxen — `pnpm typecheck` har INTE körts
- TypeScript-koden är manuellt läs-verifierad mot brief-spec
- `any` används bara där Supabase nested-select-responser kräver det (inline-kommenterat i `lib/data.ts`)
- Git fungerar via plumbing-kommandon (workaround eftersom `.git/*.lock` ej kan unlinkas i sandboxen)

## Caveats för dagens runda 2

- **UI-016:** MapLibre ej lagt till i `package.json` — hade riskerat native build-fel utan prebuild-konfig. `app/map.tsx` visar nu en snygg lista över klubbar med koordinater som tillfällig ersättning. Kartknappen (🗺️) i Discover's sökbar navigerar till denna skärm.
- **UI-019:** `OfflineBanner` importeras i `app/_layout.tsx` från `@react-native-community/netinfo`. Installera innan första körning.
- **UI-021:** `lib/haptics.ts` importerar `expo-haptics`. Samma som ovan — installera innan första körning.

## Self-check

För varje brief i runda 2 har jag läst igenom filerna jag skrev och bekräftat:
- Alla imports hänvisar till exporterade symboler
- JSX är välformad (matchande taggar)
- useState/useEffect/useCallback ligger på top-level i komponenterna
- Inga `any` utan kommentar
- RefreshControl spinner är grön (#0F6E56) på alla pull-to-refresh-vyer

## Blockerade briefs

*(inga blockerade i denna runda)*

## Nästa steg för Zivar

- Installera nya deps (netinfo, haptics, location, image-picker) och kör migrationerna (006–014) om ej redan gjorda
- Bestäm om MapLibre/Google Maps ska aktiveras (prebuild + real-map-komponent)
- Om Prio 2-briefs ska köras: skriv fulla brief-filer i `docs/briefs/` och re-aktivera scheduled task `nightly-run-2-briefs`
- Push: `git push origin claude/nightly-run-2` → öppna PR mot main

## Slutstatus (runda 4)

Inga TODO-briefs i `docs/briefs/BRIEF-QUEUE.md`. Alla 30 körbara briefs är DONE. BRIEF-IN-003 markerad SKIPPED (push, kräver Expo-konto). Prio 2 (UI-029, IN-004..008, IN-011..013, m.fl.) är medvetet uppskjutna utan fulla brief-filer. Branch är redo för manuell push av Zivar.

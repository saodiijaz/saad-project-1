# BRIEF-UI-027: Privata events (endast inbjudna)

## Status
✅ READY — DB-migration + UI-toggle.

## Mål
Vid skapande av event ska creator kunna markera det som **privat**. Privata events syns inte i den publika events-listan — bara för creator + uttryckliga inbjudna.

Denna brief levererar grunden:
- DB: `event_invites`-tabell + uppdaterad RLS på `events`
- UI: toggle "Privat" i `event/new`
- Privata events filtreras bort från den publika listan

Inbjudnings-UI för att lägga till specifika vänner kommer i framtida brief.

## Blockerad av
Inget. Migration 014.

## Berörda filer
- `supabase/migrations/014_private_events.sql`
- `apps/mobile/lib/data.ts` — utöka `createEvent`-param med `isPublic`
- `apps/mobile/app/event/new.tsx` — toggle

## Steg

### 1. SQL
Skapa `event_invites` (event_id, invitee_id, invited_by, created_at), enable RLS, droppa befintlig "Anyone can read public events"-policy och ersätt med en som tillåter creator + inbjudna.

### 2. Helper
`createEvent({ ..., isPublic = true })` — skicka till `events.is_public`.

### 3. UI
I `event/new.tsx`: ny toggle-rad "🔒 Privat event (endast inbjudna)". Default false.

## Verifiering
- [ ] Skapa publikt event → syns i Events-fliken
- [ ] Skapa privat event → syns INTE i fliken för andra
- [ ] Creator ser fortfarande sitt privata event på event-detalj-sidan
- [ ] Inbjudna (via separat UI senare) kan se det

## Commit
`BRIEF-UI-027: Private events toggle + event_invites table (migration 014)`

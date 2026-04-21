# BRIEF-DB-003: Events-seed för LHC

## Mål
Seed 2 events för Linköpings HC så Events-fliken har innehåll att visa direkt efter NIGHTLY-RUN-2.

## Kontext
- Förutsätter att migration 006 (BRIEF-DB-002) är körd → tabellen `events` finns
- Zivar måste köra denna migration manuellt i SQL Editor (som alltid)
- Events-fliken (UI-006) kommer visa dessa

## Blockerad av
⛔ Kräver att Zivar kört migration 006 i Supabase SQL Editor. Om `events`-tabellen inte finns → hoppa denna brief, markera BLOCKED, fortsätt till nästa.

## Berörda filer
- `supabase/migrations/008_seed_lhc_events.sql` — ny

## Steg

Skapa `supabase/migrations/008_seed_lhc_events.sql`:

```sql
-- BRIEF-DB-003: Seed events for LHC
-- Kör manuellt efter migration 006 och 007

insert into public.events (club_id, created_by, title, description, location, starts_at, is_public)
select
  c.id,
  (select id from public.users where email ilike '%zivar%' limit 1),
  'Öppen träning — Hockeyskola',
  'Barn och ungdomar välkomna att prova på. Ingen förkunskap krävs, vi har utrustning att låna.',
  'Saab Arena, Linköping',
  now() + interval '5 days',
  true
from public.clubs c
where c.slug = 'linkopings-hc'
on conflict do nothing;

insert into public.events (club_id, created_by, title, description, location, starts_at, is_public)
select
  c.id,
  (select id from public.users where email ilike '%zivar%' limit 1),
  'Supporterträff inför VM',
  'Häng med oss och kolla öppningsmatchen i VM. Mat och dryck serveras.',
  'Saab Arena Lounge',
  now() + interval '10 days',
  true
from public.clubs c
where c.slug = 'linkopings-hc'
on conflict do nothing;
```

## Verifiering
- [ ] Filen finns i `supabase/migrations/`
- [ ] Filen heter exakt `008_seed_lhc_events.sql`
- [ ] `pnpm typecheck` är grönt (ingen .ts-ändring, men säkerhetskoll)

## Anti-patterns
- Skapa INTE events direkt i DB via Cowork — bara migration-filen skrivs
- Gissa INTE zivar's user.id — använd subquery mot public.users

## Commit
`BRIEF-DB-003: Seed LHC events`

## Rollback
```bash
git rm supabase/migrations/008_seed_lhc_events.sql
git commit -m "Rollback BRIEF-DB-003"
```

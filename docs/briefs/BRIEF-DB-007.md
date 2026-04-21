# BRIEF-DB-007: Flera städer — schema-stöd

## Mål
Lägg till en `cities`-tabell med curated lista av svenska städer + utöka clubs.city att vara FK dit. Detta möjliggör city-filter + karta senare.

## Kontext
- Idag är `clubs.city` en fri text
- Migrera till controlled vocabulary: `cities(id, name, region, lat, lng)`
- Befintliga klubbar har alla `city = 'Linköping'` → mappa rakt

## Berörda filer
- `supabase/migrations/012_cities.sql` — ny

## Steg

Skapa `supabase/migrations/012_cities.sql`:

```sql
-- BRIEF-DB-007: Cities table + clubs.city_id FK

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  region text,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now()
);

alter table public.cities enable row level security;
create policy "Anyone can read cities" on public.cities for select using (true);

-- Seed — de största svenska städerna + Linköping
insert into public.cities (name, region, latitude, longitude) values
  ('Stockholm', 'Stockholms län', 59.3293, 18.0686),
  ('Göteborg', 'Västra Götalands län', 57.7089, 11.9746),
  ('Malmö', 'Skåne län', 55.6050, 13.0038),
  ('Uppsala', 'Uppsala län', 59.8586, 17.6389),
  ('Linköping', 'Östergötlands län', 58.4108, 15.6214),
  ('Västerås', 'Västmanlands län', 59.6162, 16.5528),
  ('Örebro', 'Örebro län', 59.2741, 15.2066),
  ('Helsingborg', 'Skåne län', 56.0465, 12.6945),
  ('Norrköping', 'Östergötlands län', 58.5877, 16.1924),
  ('Jönköping', 'Jönköpings län', 57.7826, 14.1618),
  ('Umeå', 'Västerbottens län', 63.8258, 20.2630),
  ('Lund', 'Skåne län', 55.7047, 13.1910),
  ('Borås', 'Västra Götalands län', 57.7210, 12.9401),
  ('Sundsvall', 'Västernorrlands län', 62.3908, 17.3069),
  ('Gävle', 'Gävleborgs län', 60.6749, 17.1413)
on conflict (name) do nothing;

-- Lägg till city_id som nullable först
alter table public.clubs add column if not exists city_id uuid references public.cities(id);

-- Backfyll existerande rader från city-text
update public.clubs c
set city_id = cities.id
from public.cities
where cities.name = c.city and c.city_id is null;

-- Behåll clubs.city-kolumnen tills vidare (för smidig migration)
-- En senare migration kan droppa den när all kod använder city_id
```

## Verifiering
- [ ] Fil skapad
- [ ] `pnpm typecheck` grönt (ingen TS-påverkan ännu)
- [ ] Efter migration: `select count(*) from public.cities` = 15
- [ ] `select count(*) from public.clubs where city_id is null` = 0 (om alla befintliga clubs har en mappad stad)

## Anti-patterns
- Släpp INTE `clubs.city` direkt — det skulle kräva synkroniserade kodändringar. Dual-write lösning.
- Antag INTE att alla 15 städer behövs — men de är lätta att lägga till och fungerar som dropdown-källa

## Commit
`BRIEF-DB-007: Cities table and clubs.city_id FK`

## Rollback
```sql
alter table public.clubs drop column city_id;
drop table public.cities;
```

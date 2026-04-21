# BRIEF-UI-024: Sortering i Upptäck (populärast, nyast, A-Ö)

## Status
✅ READY — ingen native dep krävs.

## Mål
Ge användaren möjlighet att sortera klubblistan i Upptäck på `Populärast` (följarantal, fallande), `Nyast` (created_at, fallande) och `A-Ö` (alfabetiskt).

## Blockerad av
Inget. Använder `clubs.created_at` och `follows`-tabellen (finns redan).

## Berörda filer
- `apps/mobile/lib/data.ts` — utöka `getClubs` med sort-param + hämta följarantal per klubb
- `apps/mobile/app/(tabs)/index.tsx` — segmented control för sort-val

## Steg

### 1. `lib/data.ts`:
- Lägg till `ClubSort = 'popular' | 'newest' | 'alpha'`
- `getClubs(sort?: ClubSort)` — för `popular`, gör en select som också räknar `follows`. Enklast: hämta alla klubbar + separat `count` från `follows`-tabellen group-by club_id, merga i JS.

### 2. `(tabs)/index.tsx`:
- Ny state `sort: ClubSort = 'popular'`
- Segmented row ovanför chip-filter: [Populärast | Nyast | A-Ö]
- Kalla `getClubs(sort)` igen vid sort-ändring (eller sortera i minnet om det är enklare).

## Verifiering
- [ ] Välj "Populärast" → klubbar med flest följare överst
- [ ] Välj "Nyast" → senast skapad överst
- [ ] Välj "A-Ö" → alfabetisk
- [ ] Filter (stad/sport) fungerar fortfarande ovanpå sorteringen

## Commit
`BRIEF-UI-024: Sort order (popular/newest/alpha) in Discover`

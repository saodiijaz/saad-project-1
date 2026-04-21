# BRIEF-IN-001: App-fundament + Upptäck-skärm med mock-data

## Mål
Sätt upp monorepo-strukturen, skapa Expo-appen med tre flikar (Upptäck, Flöde, Profil) och bygg en **fungerande Upptäck-skärm med mock-data för 5 föreningar i Linköping**. Supabase-klienten förbereds men är inaktiverad tills nycklarna kommer.

Efter denna brief: Din vän ska kunna öppna appen och scrolla en riktig lista av föreningar på sin telefon, klicka på en, och se en profilsida.

## Kontext
- **Repo:** https://github.com/saodiijaz/saad-project-1 (tomt, bara README)
- **Vem kodar:** Du (en person) — din vän är offline just nu
- **Supabase:** Projekt finns men URL + nyckel är hos din vän, kommer senare
- **Stad:** Linköping
- **Strategi:** Bygg UI med mock-data först, byt mot Supabase när nycklarna kommer

**Varför mock-data först:**
- Din vän ser visuell progress idag
- Mock-datan har exakt samma fält som framtida DB-tabell → swap blir trivial
- Appen kan demonstreras utan backend
- Inloggning hoppas över för nu (kommer i BRIEF-UI-001)

**Vad denna brief INTE gör:**
- Ingen inloggning
- Ingen databas
- Ingen bild-uppladdning
- Inget följ-system (knappen finns men gör inget än)

## Berörda filer (skapas från tomt repo)
- `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.env.example`, `README.md`
- `apps/mobile/` — Expo-app
  - `app/_layout.tsx` — root layout
  - `app/(tabs)/_layout.tsx` — tab-navigation
  - `app/(tabs)/index.tsx` — Upptäck
  - `app/(tabs)/feed.tsx` — Flöde (placeholder)
  - `app/(tabs)/profile.tsx` — Profil (placeholder)
  - `app/club/[id].tsx` — Föreningsprofil
  - `lib/supabase.ts` — klient (inaktiv utan env)
  - `lib/mock-data.ts` — 5 Linköpings-föreningar
  - `lib/data.ts` — datahämtning (mock eller Supabase)
  - `lib/types.ts` — TS-typer (matchar framtida schema)
- `packages/shared/` — delat paket (tomt nu)
- `docs/briefs/BRIEF-IN-001.md` — denna fil

## Verifiering
- [ ] `pnpm dev` startar utan fel
- [ ] Appen öppnas i Expo Go via QR-kod
- [ ] Gul banner syns: "Demo-läge: visar mock-data"
- [ ] Tre flikar syns: Upptäck, Flöde, Profil
- [ ] Upptäck visar 5 föreningar i Linköping
- [ ] Sökrutan filtrerar ("golf" → bara Landeryds GK)
- [ ] Klick på förening → profilsida med beskrivning
- [ ] Följ-knapp växlar mellan "Följ" och "Följer ✓"
- [ ] Flöde och Profil visar placeholders
- [ ] Commit pushad till GitHub

## Anti-patterns
- **Skapa INTE** `.env` nu — demo-läget funkar utan.
- **Lägg INTE** till mer mock-data än dessa 5.
- **Skapa INTE** inloggningsskärm — kommer i BRIEF-UI-001.
- **Installera INTE** UI-bibliotek (NativeBase, Tamagui). Vanlig RN räcker för MVP.
- **Använd INTE** npm/yarn — endast pnpm från root.

## Kopplingar
- **Föregående:** Ingen (första briefen)
- **Nästa (när Supabase-nycklar finns):** `BRIEF-DB-001` — skapa de 7 tabellerna, lägg in de 5 föreningarna som riktig data
- **Därefter:** `BRIEF-UI-001` — inloggning med magic link

## Hand-off till din vän
När din vän kommer tillbaka med Supabase-nycklarna:

1. Han skapar `apps/mobile/.env` med URL + anon key (aldrig committad)
2. Omstart: `pnpm dev`
3. Gula "Demo-läge"-bannern försvinner
4. Appen försöker nu hämta från Supabase — **men DB är tom** så listan blir tom

Det är signalen att köra `BRIEF-DB-001` som skapar tabellerna och lägger in de 5 föreningarna som riktig data.

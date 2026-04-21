# BRIEF-DB-001: Databasschema + koppla app till Supabase

## Mål
Skapa de 7 MVP-tabellerna i Supabase, lägg in sporter, migrera de 5 mock-föreningarna till riktig data, och aktivera `.env` så att appen läser från Supabase istället för mock-data.

Efter denna brief: Gula "Demo-läge"-bannern försvinner. Appen hämtar föreningar från riktiga databasen. Samma 5 föreningar syns, men nu från Supabase.

## Kontext
- **Föregående brief:** BRIEF-IN-001 byggde appen med mock-data
- **Supabase-projekt:** `yhlaacpvucjvnczyauze.supabase.co` (region EU North, Stockholm)
- **Tabeller som ska skapas:** `users`, `clubs`, `club_members`, `club_posts`, `follows`, `sports`, `club_sports`
- **Branch:** Skapa ny branch `brief-db-001-schema` från main (efter BRIEF-IN-001 är mergat)

**Viktigt:**
- ALLT i `public` schema (aldrig `corevo`, aldrig annat)
- RLS aktiverat på alla tabeller
- Auth-integration: `users.id` refererar `auth.users.id` (Supabase Auth-tabell)
- Migrations sparas i `supabase/migrations/` (numrerade)

**Vad denna brief INTE gör:**
- Ingen inloggning/auth-flöde (kommer i BRIEF-UI-001)
- Ingen post-publicering (`club_posts` finns men vyn kommer senare)
- Ingen följ-logik (knappen finns men sparas inte än)

## Berörda filer
- `supabase/migrations/001_create_core_schema.sql` — skapar alla tabeller
- `supabase/migrations/002_seed_sports.sql` — sport-kategorier
- `supabase/migrations/003_seed_linkoping_clubs.sql` — 5 föreningar
- `apps/mobile/.env` — URL + anon key (gitignored, skapas manuellt)
- `apps/mobile/.env.example` — mall utan värden (committas)
- `apps/mobile/lib/data.ts` — uppdaterad för JOIN mot `club_sports` + `sports`
- `docs/briefs/BRIEF-DB-001.md` — denna fil

## Steg

### Steg 1 — Skapa branch och brief-mapp

```bash
cd ~/saad-project-1
git checkout main
git pull origin main
git checkout -b brief-db-001-schema
mkdir -p supabase/migrations
```

### Steg 2 — Migrations

Filerna ligger i `supabase/migrations/`:
- `001_create_core_schema.sql` — tabeller + RLS
- `002_seed_sports.sql` — 20 sporter
- `003_seed_linkoping_clubs.sql` — 5 föreningar + kopplingar

### Steg 3 — Kör migrations i Supabase

**Alt A — Manuellt via Supabase Dashboard:**

1. Öppna https://supabase.com/dashboard/project/yhlaacpvucjvnczyauze
2. Vänstra menyn → **SQL Editor** → **New query**
3. Kopiera hela `001_create_core_schema.sql`, klistra in, **Run**
4. Upprepa för `002_seed_sports.sql` och `003_seed_linkoping_clubs.sql`

**Alt B — Via Supabase CLI:**

```bash
pnpm add -D supabase
npx supabase login
npx supabase link --project-ref yhlaacpvucjvnczyauze
npx supabase db push
```

### Steg 4 — Verifiera data finns

I Supabase Dashboard → **Table Editor**:
- `sports` → 20 rader
- `clubs` → 5 rader
- `club_sports` → 8 rader
- `users`, `club_members`, `club_posts`, `follows` → tomma (korrekt)

### Steg 5 — Skapa lokal .env (committas INTE)

```bash
cat > apps/mobile/.env << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://yhlaacpvucjvnczyauze.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY_FROM_SUPABASE>
EOF
```

Ersätt `<ANON_KEY_FROM_SUPABASE>` med anon-nyckeln från Supabase Dashboard → Settings → API → anon public.

### Steg 6 — Testa appen

```bash
pnpm dev
```

Verifiera att gula "Demo-läge"-bannern är BORTA och att 5 föreningar laddas från Supabase.

## Verifiering
- [ ] Migration 001 körd utan fel
- [ ] Migration 002 körd, `sports` har 20 rader
- [ ] Migration 003 körd, `clubs` har 5 rader, `club_sports` har 8 rader
- [ ] RLS aktiverat på alla tabeller
- [ ] `apps/mobile/.env` finns lokalt, committas INTE
- [ ] Appen körs och "Demo-läge"-bannern är BORTA
- [ ] Sökning "golf" → bara Landeryds GK
- [ ] Profilsida funkar

## Anti-patterns
- Kör INTE migrations i fel ordning.
- Committa ALDRIG `.env`-filen.
- Skapa INTE tabeller i annat schema än `public`.
- Ta INTE BORT `mock-data.ts` — behövs som fallback.
- Ändra INTE `users.id`-kolumnen — refererar till `auth.users.id`.
- Använd INTE `service_role`-nyckeln i appen. Bara `anon public`.

## Kopplingar
- **Föregående:** BRIEF-IN-001
- **Nästa:** BRIEF-UI-001 — inloggning med magic link
- **Därefter:** BRIEF-UI-002 — följ-logik

## Rollback
```sql
drop table if exists public.follows cascade;
drop table if exists public.club_posts cascade;
drop table if exists public.club_members cascade;
drop table if exists public.club_sports cascade;
drop table if exists public.clubs cascade;
drop table if exists public.sports cascade;
drop table if exists public.users cascade;
```

Rulla tillbaka appen till mock-läge: `rm apps/mobile/.env && pnpm dev`.

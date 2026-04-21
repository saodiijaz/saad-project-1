# BRIEF-UI-001: Inloggning med magic link + admin-setup för LHC

## Mål
Användare kan logga in med e-post via magic link. När de klickar länken i mailet → tillbaka till appen, inloggade. Profil-fliken visar deras e-post. Lägg också till en databas-trigger som automatiskt skapar `public.users`-post när någon registrerar sig, och gör Zivar till admin för Linköpings HC (för testning av framtida post-funktionalitet).

Efter denna brief: Du kan logga in med din mail, se ditt namn i profilfliken, och du är tekniskt admin för LHC (redo för BRIEF-UI-002 där vi bygger post-funktionalitet).

## Kontext
- **Föregående:** BRIEF-DB-001 skapade schemat och kopplade appen till Supabase
- **Nu:** Appen visar 5 föreningar men ingen kan logga in
- **Beslut:** Magic link (e-post med klickbar länk) istället för lösenord — enklare UX, inget att glömma
- **Auth-flöde:** User anger e-post → Supabase skickar länk → Klick → deep link tillbaka till appen → inloggad
- **Zivar som admin:** Manuell koppling till LHC för att kunna testa post-funktioner senare

**Vad denna brief INTE gör:**
- Ingen post-funktionalitet (kommer i BRIEF-UI-002)
- Ingen social feed med posts (kommer i BRIEF-UI-003)
- Ingen "spara följ-knappen" till DB (kommer separat)
- Ingen avatar-uppladdning
- Ingen OAuth (Google/Apple sign-in)

## Berörda filer
- `supabase/migrations/004_auth_user_trigger.sql` — trigger som speglar auth.users → public.users
- `supabase/migrations/005_zivar_lhc_admin.sql` — manuell admin-koppling (körs efter Zivar registrerat sig)
- `apps/mobile/app/login.tsx` — ny login-skärm
- `apps/mobile/app/auth-callback.tsx` — deep link callback för magic link
- `apps/mobile/app/_layout.tsx` — uppdaterad: kolla auth-state, redirect till login om ej inloggad
- `apps/mobile/app/(tabs)/profile.tsx` — visa inloggad user + logga ut-knapp
- `apps/mobile/lib/auth.ts` — ny: auth-helpers (signIn, signOut, getSession)
- `apps/mobile/app.json` — `scheme` finns redan (`sportmeet`)
- `docs/briefs/BRIEF-UI-001.md` — denna fil
- `docs/briefs/BRIEF-UI-001-MANUAL-STEPS.md` — manuella Supabase-steg

## Verifiering
- [ ] Migration 004 körd i Supabase → trigger finns
- [ ] Manuell redirect URL satt i Supabase Auth config
- [ ] Appen startar och visar login-skärm
- [ ] Ange din e-post → "Kolla mailen"-meddelande
- [ ] Mail kommer fram från Supabase
- [ ] Klick på länken → appen öppnas, är inloggad
- [ ] Profil-fliken visar din e-post
- [ ] "Logga ut" → tillbaka till login-skärmen
- [ ] `public.users` har en rad för din email (kolla Supabase Table Editor)

## Anti-patterns
- **Commita ALDRIG** service_role-nyckeln — vi använder bara anon.
- **Skippa INTE** migration 004 — utan den finns inte användaren i `public.users` vilket bryter framtida funktioner.
- **Sätt INTE** Supabase redirect URL till `http://...` eller `https://...` — appen är inte web, den använder schema `sportmeet://`.
- **Registrera INTE** flera test-mail för samma person — det förstör Zivar-LHC-admin-kopplingen (migration 005).

## Manuellt efter inloggning (BRIEF-DB-002 light)

När du loggat in en gång och ser din e-post i profilen — kör detta i Supabase SQL Editor för att göra dig till admin för LHC (samma som migration 005, men med din riktiga e-post):

```sql
insert into public.club_members (club_id, user_id, role)
select c.id, u.id, 'admin'
from public.clubs c, public.users u
where c.slug = 'linkopings-hc'
  and u.email = 'DIN@EPOST.SE'
on conflict (club_id, user_id) do update set role = 'admin';

-- Verify
select u.email, c.name, cm.role
from public.club_members cm
join public.users u on u.id = cm.user_id
join public.clubs c on c.id = cm.club_id;
```

Ska returnera en rad med din mail + "Linköpings HC" + "admin".

## Kopplingar
- **Föregående:** BRIEF-DB-001
- **Nästa:** BRIEF-UI-002 — föreningar (du som LHC-admin) kan posta händelser
- **Därefter:** BRIEF-UI-003 — Feed-fliken visar posts från följda föreningar

## Rollback
Om magic link inte fungerar:

```bash
git checkout main
git branch -D claude/magic-link-login-qMj96
```

För Supabase:
```sql
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
delete from auth.users where email = 'din-test@mail.se';
delete from public.users where email = 'din-test@mail.se';
```

# BRIEF-QUEUE — Fortsättning efter NIGHTLY-RUN-2

> Denna fil är master-kön för Cowork.
> Cowork öppnar denna när NIGHTLY-RUN-2 är klar och kör nästa brief i ordning.
> Briefs märkta med ⛔ BLOCKED körs inte — de väntar på FORGE/Zivar.
> Briefs märkta med 🟡 NEEDS-INPUT behöver svar från Zivar innan de kan köras.

---

## Hur Cowork använder denna fil

1. Läs högst upp i "Prio 1 — Nästa i kön" — hitta första brief som inte är DONE/BLOCKED/NEEDS-INPUT
2. Öppna `docs/briefs/BRIEF-XXX-NNN.md` för den briefen
3. Implementera
4. Kör `pnpm typecheck`
5. Commit med briefens ID + beskrivning
6. Uppdatera denna fil — markera briefen som ✅ DONE (eller ⛔ BLOCKED)
7. Gå till nästa

**Stoppregel:** 3+ BLOCKED i rad → skriv STATUS.md och stoppa helt.

---

## Prio 1 — Nästa i kön (kör efter NIGHTLY-RUN-2)

| # | ID | Namn | Status | Blockad av |
|---|---|---|---|---|
| 1 | BRIEF-DB-003 | Events-seed för LHC | ⬜ TODO | migration 006 (Zivar kör) |
| 2 | BRIEF-UI-009 | Profil: avatar upload | ⬜ TODO | — |
| 3 | BRIEF-DB-004 | Friends/vänsystem schema | ⬜ TODO | — |
| 4 | BRIEF-UI-010 | Vänsystem UI (lägg till/vänlista) | ⬜ TODO | DB-004 |
| 5 | BRIEF-DB-005 | User posts schema | ⬜ TODO | — |
| 6 | BRIEF-UI-011 | User posts UI (skapa + visa) | ⬜ TODO | DB-005 |
| 7 | BRIEF-DB-006 | Kommentarer + likes schema | ⬜ TODO | DB-005 |
| 8 | BRIEF-UI-012 | Kommentarer + likes UI | ⬜ TODO | DB-006 |
| 9 | BRIEF-UI-013 | Föreningsadmin: redigera profil + logo | ⬜ TODO | — |
| 10 | BRIEF-UI-014 | Föreningsadmin: följarlista | ⬜ TODO | — |
| 11 | BRIEF-DB-007 | Flera städer stöd | ⬜ TODO | — |
| 12 | BRIEF-UI-015 | Stad-filter i Upptäck | ⬜ TODO | DB-007 |
| 13 | BRIEF-UI-016 | Karta över föreningar | 🟡 NEEDS-INPUT | val av kart-bibliotek |
| 14 | BRIEF-IN-002 | Deep linking (dela föreningslänk) | ⬜ TODO | — |
| 15 | BRIEF-IN-003 | Push-notiser setup (Expo push) | 🟡 NEEDS-INPUT | Expo push account |

---

## Prio 2 — Senare (backlog, fulla briefs när deras tur kommer)

| # | ID | Namn | Kategori |
|---|---|---|---|
| 16 | BRIEF-UI-017 | Dagens bild-tävling | Social |
| 17 | BRIEF-UI-018 | Privata events (endast inbjudna) | Events |
| 18 | BRIEF-UI-019 | Event-chat | Events |
| 19 | BRIEF-UI-020 | Provträna-flöde (boka pass) | Bokning |
| 20 | BRIEF-IN-004 | Swish-integration | Betalning |
| 21 | BRIEF-UI-021 | Affiliate-bokningar (beachvolley, padel) | Bokning |
| 22 | BRIEF-UI-022 | Kvitton för bokningar | Bokning |
| 23 | BRIEF-UI-023 | Föreningsstatistik (följare, räckvidd) | Admin |
| 24 | BRIEF-UI-024 | Sortering (populärast, närmast, nyast) | Sök |
| 25 | BRIEF-UI-025 | "Nära mig"-funktion (GPS) | Sök |
| 26 | BRIEF-UI-026 | Badges / achievements | Gamification |
| 27 | BRIEF-UI-027 | Turneringar + prispengar | Gamification |
| 28 | BRIEF-UI-028 | Sponsor-placeringar | Gamification |
| 29 | BRIEF-UI-029 | Budgivning om listplacering | Gamification |
| 30 | BRIEF-IN-005 | SMS-notiser (2h innan event) | Infra |
| 31 | BRIEF-IN-006 | Offline-stöd | Infra |
| 32 | BRIEF-IN-007 | Real BankID-verifiering | Infra |
| 33 | BRIEF-IN-008 | Superadmin-panel | Verktyg |
| 34 | BRIEF-IN-009 | Moderation (rapportera, ban) | Verktyg |
| 35 | BRIEF-IN-010 | PostHog/Analytics | Verktyg |
| 36 | BRIEF-IN-011 | Android APK (Play Store build) | Distribution |
| 37 | BRIEF-IN-012 | iOS (TestFlight build) | Distribution |
| 38 | BRIEF-IN-013 | Custom domain + universal links | Distribution |

---

## Legend

| Status | Betydelse |
|---|---|
| ⬜ TODO | Redo att köras |
| 🔄 IN-PROGRESS | Cowork jobbar på den nu |
| ✅ DONE | Klar, committad |
| ⛔ BLOCKED | Något stoppade — Cowork hoppar och rapporterar |
| 🟡 NEEDS-INPUT | Kräver beslut/input från Zivar innan körning |

---

## Regler för Prio 2 → Prio 1

Prio 2-briefs är **stubs** i denna fil (bara namn + kategori). Deras fulla brief-filer (BRIEF-XXX-NNN.md) finns INTE skrivna än. När en Prio 2-brief ska bli nästa upp:

1. Zivar/FORGE skriver full brief-fil för den
2. Flyttar den till Prio 1-tabellen
3. Tar bort den från Prio 2

Cowork kör ALDRIG en Prio 2-brief utan att den först blivit en Prio 1 med fullständig brief-fil.

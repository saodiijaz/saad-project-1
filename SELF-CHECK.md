# SELF-CHECK PROTOCOL

> Cowork: Du läser denna fil EFTER varje brief du har implementerat men INNAN du går vidare till nästa.
> Du kör igenom checklistan, fyller i ditt eget svar, och fattar ett beslut.

---

## SYFTE

Du kan inte köra `pnpm typecheck` i sandboxen. Men du kan göra en **manuell läs-igenom** av din egen kod för att hitta uppenbara fel innan du går vidare.

Detta minskar risken att kodbasen ackumulerar fel som smäller alla på en gång när Zivar kör typecheck lokalt.

---

## KÖR DETTA EFTER VARJE BRIEF

### Steg 1: Lista ändrade filer
Kör:
```bash
git diff --name-only HEAD~1 HEAD
```
Skriv ner listan i brief-mappen eller POST-FLIGHT.

### Steg 2: Öppna varje fil och läs igenom

För varje fil du skrev/ändrade, kontrollera:

#### TypeScript/TSX-filer

- [ ] **Imports** — Är alla namn som importeras faktiskt exporterade från sin källfil?
  - Exempel: `import { getFeed, FeedItem } from '../../lib/data'` → finns `FeedItem` verkligen i `data.ts`?
- [ ] **Types** — Används alla typer konsekvent?
  - Exempel: Om en prop är `Club | null`, hanteras null-case i koden?
- [ ] **Async/await** — Varje `await` är inuti en `async` funktion?
- [ ] **Unused imports** — Importerar du något du inte använder?
- [ ] **Missing returns** — Har funktioner med deklarerad return-typ alltid return?
- [ ] **Hook-regler** — useState, useEffect, useCallback bara på top-level av komponenten? Inte i loops, conditions, eller nested functions?
- [ ] **JSX-syntax** — Varje öppnande tag har matchande stängning? Varje `{expression}` är gilitig?
- [ ] **Dependency-arrays** — useEffect/useCallback har korrekta deps?

#### SQL-filer

- [ ] **Syntax** — Varje statement slutar med `;`?
- [ ] **Ordning** — Tabeller skapas INNAN de refereras av RLS-policies eller andra tabeller?
- [ ] **Idempotens** — Använder `create table`, `create index`, `create policy` — kan den köras två gånger utan att krascha? Om inte, lägg till `IF NOT EXISTS` eller `on conflict do nothing`.
- [ ] **RLS** — Varje ny tabell har `alter table ... enable row level security` + minst en policy?
- [ ] **Constraints** — Primary keys, foreign keys, checks är korrekta?

### Steg 3: Korsreferenser med briefen

Öppna brief-filen igen och:

- [ ] **Alla filer i "Berörda filer"** — är alla ändrade?
- [ ] **Alla steg under "Steg"** — är alla utförda?
- [ ] **Alla punkter i "Verifiering"** — passerar de (utom typecheck)?
- [ ] **Alla "Anti-patterns"** — har du undvikit dem?

### Steg 4: Sanity-check mot resten av kodbasen

- [ ] **Ny hook/helper** — använder du rätt namngivning mot befintliga (camelCase, etc.)?
- [ ] **Nya komponenter** — följer du samma stil som andra komponenter i samma mapp?
- [ ] **Import-paths** — relativa paths är korrekta (`../../lib/data` vs `../../../lib/data`)?

### Steg 5: Beslut

Fyll i brief-mappens POST-FLIGHT.md (eller commit-meddelande):

```
SELF-CHECK RESULTAT:
- Files changed: <lista>
- TypeScript reviewed: OK / Issues found: <lista>
- SQL reviewed: OK / Issues found: <lista>
- Brief requirements met: OK / Partial / Missing: <lista>
- Status: READY / NEEDS_FIX

Om READY: gå till nästa brief.
Om NEEDS_FIX: fixa det du hittade, kör self-check igen, sedan committa.
```

---

## VIKTIGA REGLER

1. **Rusha inte** — 2 minuter self-check sparar 20 minuter buggjakt imorgon
2. **Dokumentera osäkerheter** — om du inte är 100% säker på att en fil är korrekt, skriv det i POST-FLIGHT så Zivar kan titta extra noga på den filen
3. **Gissa aldrig** — om en import eller typ känns fel, kolla källfilen; aldrig commita på "det kanske funkar"
4. **Flagga risker explicit** — om en brief kräver ett steg du inte kan utföra (t.ex. migration måste köras i Supabase först), markera den DONE-WITH-CAVEATS med tydlig notering om vad Zivar måste göra manuellt

---

## OM DU HITTAR FEL

Om self-check avslöjar ett fel i kod du redan committat:

1. Fixa felet
2. Kör self-check på fixen
3. Gör en ny commit: "FIX BRIEF-XXX: <vad som fixades>"
4. Uppdatera POST-FLIGHT
5. Gå vidare

Du spenderar **max 2 försök per brief** på samma fel (som alltid). Om samma fel kvarstår efter 2 fixförsök → BLOCKED, gå vidare.

---

## CHECK-IN I STATUS.md

Efter varje brief, uppdatera `STATUS.md` i repo-roten med:

```
BRIEF-XXX:
- Status: DONE / DONE-WITH-CAVEATS / BLOCKED
- Self-check: PASS / ISSUES FIXED / ISSUES REMAIN
- Files: <lista>
- Caveats (if any): <vad Zivar behöver veta>
```

---

**Kom ihåg: Zivar sover. Du är den enda kvalitetssäkringen tills han vaknar. Gör det bra.**

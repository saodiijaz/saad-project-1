# BRIEF-UI-028: Bjud in vänner till privat event

## Status
✅ READY — bygger på BRIEF-UI-027.

## Mål
På event-detalj-sidan, om jag är creator och eventet är privat, visa en lista med mina vänner och en "Bjud in"-knapp per vän. Vid tryck: skapa rad i `event_invites`.

## Blockerad av
BRIEF-UI-027 (event_invites-tabellen).

## Berörda filer
- `apps/mobile/lib/data.ts` — `inviteFriend(eventId, friendUserId)`, `getEventInvitees(eventId)`, `isEventCreator(eventId)`
- `apps/mobile/app/event/[id].tsx` — invite-sektion

## Steg

### 1. Helpers
- `isEventCreator(eventId)` → jämför event.created_by mot auth.uid()
- `inviteFriend(eventId, friendId)` → insert i event_invites
- `getEventInvitees(eventId)` → läs invitees (joinas mot users)

### 2. UI
I event/[id].tsx, om creator + ej publikt:
- Rendera lista över "Mina vänner" med ⊕ Bjud in-knapp
- När inbjuden: ändras till "Inbjuden ✓"
- Visa inbjudnas avatarer

## Verifiering
- [ ] Som creator på privat event → ser lista med vänner
- [ ] Tryck "Bjud in" → rad i event_invites, knapp ändras
- [ ] Inbjuden vän: kan nu se eventet i sin Events-flik

## Commit
`BRIEF-UI-028: Invite friends to private events`

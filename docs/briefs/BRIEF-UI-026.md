# BRIEF-UI-026: Badges / achievements (MVP)

## Status
✅ READY — bygger på existerande tabeller.

## Mål
Visa enkla badges på profil-fliken baserat på användarens aktivitet:
- 🆕 **Nykomling** — har konto
- 👋 **Social** — minst 3 vänner
- ❤️ **Aktiv** — minst 5 likes givna
- 💬 **Snackar** — minst 3 kommentarer
- 📣 **Påläst** — följer minst 5 föreningar
- 🏆 **Grundare** — admin för minst 1 förening

## Kontext
Helt deriverat från befintliga rader (friendships, post_likes, post_comments, follows, club_members). Ingen ny DB.

## Berörda filer
- `apps/mobile/lib/badges.ts` — definiera badges + `getMyBadges()`
- `apps/mobile/app/(tabs)/profile.tsx` — visa badge-rad

## Steg

### 1. `lib/badges.ts`:
```typescript
export type Badge = { id: string; emoji: string; label: string; description: string; earned: boolean }
export async function getMyBadges(): Promise<Badge[]> {
  // Räkna respektive count parallellt
  // Returnera Badge[] med earned-flagga
}
```

### 2. `(tabs)/profile.tsx`:
- Hämta badges
- Rendera grid med earned vs locked styling

## Verifiering
- [ ] Badges renderar
- [ ] Earned badges syns färgglada, locked är gråa
- [ ] Räkningen är korrekt mot DB

## Commit
`BRIEF-UI-026: Profile achievement badges (MVP)`

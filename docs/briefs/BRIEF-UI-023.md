# BRIEF-UI-023: Föreningsstatistik (admin-vy)

## Status
✅ READY — bygger på existerande tabeller (`follows`, `club_posts`, `post_likes`, `post_comments`).

## Mål
När en användare som är admin för en förening öppnar `club/[id]` ska de se en liten statistik-panel med:
- Antal följare
- Antal publicerade posts
- Totalt antal likes på klubbens posts
- Totalt antal kommentarer på klubbens posts

## Blockerad av
Inget — alla underliggande tabeller finns från BRIEF-DB-002 / DB-006.

## Berörda filer
- `apps/mobile/lib/data.ts` — ny helper `getClubStats(clubId)`
- `apps/mobile/app/club/[id].tsx` — visa stats-panel om `admin`

## Steg

### 1. `lib/data.ts`:
```typescript
export type ClubStats = {
  followers: number
  posts: number
  likes: number
  comments: number
}

export async function getClubStats(clubId: string): Promise<ClubStats> {
  if (!supabase) return { followers: 0, posts: 0, likes: 0, comments: 0 }
  // 1. Followers + posts via count
  // 2. Likes/comments: hämta postIds först, summera i JS
  ...
}
```

### 2. `club/[id].tsx`:
- Hämta `getClubStats(id)` när `admin === true`
- Rendera fyra kort i en grid (2x2): följare / posts / likes / kommentarer
- Endast synlig för admin

## Verifiering
- [ ] Som admin: stats-panel syns under follow-knappen
- [ ] Som icke-admin: ingen panel
- [ ] Siffrorna stämmer med faktiskt antal i db

## Commit
`BRIEF-UI-023: Club statistics panel for admins`

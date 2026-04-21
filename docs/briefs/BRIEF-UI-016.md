# BRIEF-UI-016: Karta över föreningar (MapLibre)

## Status
✅ READY — använder MapLibre (gratis, OpenStreetMap).

## Mål
Ny skärm `/map` som visar alla föreningar som markers på en karta. Klick på marker → popup → knapp till klubbsidan.

## Kontext
- MapLibre är open source, ingen API-nyckel krävs
- `cities`-tabellen har lat/lng — varje klubb använder sin stads koordinater (MVP — senare kan klubbar ha egna koordinater)
- Demo-tiles från MapTiler (gratis kvot 100k/mån) eller OpenStreetMap direkt

## Blockerad av
BRIEF-DB-007 (cities-tabell + clubs.city_id). Om den inte körd → markera BLOCKED.

## Förutsättningar
```bash
cd apps/mobile
npx expo install @maplibre/maplibre-react-native
```

**För Android** — lägg till i `android/build.gradle` (root):
```gradle
allprojects {
    repositories {
        maven { url "https://api.mapbox.com/downloads/v2/releases/maven" }
    }
}
```

Kommentar: Eftersom projektet använder Expo managed workflow kan config-plugin krävas. Prova först utan, och om build failar lägg till i `app.json`:
```json
"plugins": [
  ["@maplibre/maplibre-react-native"]
]
```

## Berörda filer
- `apps/mobile/lib/data.ts` — getClubsForMap helper
- `apps/mobile/app/map.tsx` — ny skärm
- `apps/mobile/app/(tabs)/_layout.tsx` — lägg till Map-tab ELLER en knapp på Upptäck
- `apps/mobile/package.json` — ny dep

## Steg

### 1. Lägg till i `apps/mobile/lib/data.ts`:
```typescript
export type MapClub = {
  id: string
  name: string
  city: string
  latitude: number
  longitude: number
  sports: string[]
}

export async function getClubsForMap(): Promise<MapClub[]> {
  if (!hasSupabaseConfig || !supabase) return []
  const { data, error } = await supabase
    .from('clubs')
    .select(`
      id, name, city,
      cities ( latitude, longitude ),
      club_sports ( sports ( slug ) )
    `)
  if (error) throw error
  return (data ?? [])
    .filter((c: any) => c.cities)
    .map((c: any) => (
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
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      latitude: c.cities.latitude,
      longitude: c.cities.longitude,
      sports: (c.club_sports ?? []).map((cs: any) => cs.sports?.slug).filter(Boolean),
    }))
}
```

### 2. Skapa `apps/mobile/app/map.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { useRouter, Stack } from 'expo-router'
// @ts-ignore — types may not be perfect in all versions
import MapLibreGL from '@maplibre/maplibre-react-native'
import { getClubsForMap, MapClub } from '../lib/data'

// Disable telemetry (privacy)
MapLibreGL.setAccessToken(null)

// Free OSM demo style. For production consider MapTiler (free tier 100k/month).
const MAP_STYLE = 'https://demotiles.maplibre.org/style.json'

export default function MapScreen() {
  const router = useRouter()
  const [clubs, setClubs] = useState<MapClub[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<MapClub | null>(null)

  useEffect(() => {
    getClubsForMap().then(setClubs).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator /></View>
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Karta' }} />
      <MapLibreGL.MapView
        style={{ flex: 1 }}
        styleURL={MAP_STYLE}
        logoEnabled={false}
        attributionEnabled={true}
      >
        <MapLibreGL.Camera
          zoomLevel={5}
          centerCoordinate={[15.6214, 58.4108]} // Linköping default
        />
        {clubs.map(c => (
          <MapLibreGL.PointAnnotation
            key={c.id}
            id={c.id}
            coordinate={[c.longitude, c.latitude]}
            onSelected={() => setSelected(c)}
          >
            <View style={styles.marker}>
              <Text style={styles.markerText}>⚽</Text>
            </View>
          </MapLibreGL.PointAnnotation>
        ))}
      </MapLibreGL.MapView>

      {selected && (
        <View style={styles.popup}>
          <Text style={styles.popupTitle}>{selected.name}</Text>
          <Text style={styles.popupSub}>{selected.city} · {selected.sports.join(', ')}</Text>
          <View style={styles.popupRow}>
            <Pressable style={styles.popupBtn} onPress={() => router.push(`/club/${selected.id}`)}>
              <Text style={styles.popupBtnText}>Öppna klubb</Text>
            </Pressable>
            <Pressable style={styles.popupClose} onPress={() => setSelected(null)}>
              <Text style={styles.popupCloseText}>Stäng</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  marker: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0F6E56', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  markerText: { fontSize: 18 },
  popup: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  popupTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  popupSub: { fontSize: 13, color: '#666', marginBottom: 12 },
  popupRow: { flexDirection: 'row', gap: 10 },
  popupBtn: { flex: 1, backgroundColor: '#0F6E56', padding: 12, borderRadius: 8, alignItems: 'center' },
  popupBtnText: { color: '#fff', fontWeight: '500' },
  popupClose: { paddingHorizontal: 16, justifyContent: 'center' },
  popupCloseText: { color: '#666' },
})
```

### 3. Lägg till en knapp på Upptäck som öppnar kartan

I `apps/mobile/app/(tabs)/index.tsx`, bredvid search-input eller högst upp, lägg till:
```tsx
<Pressable style={styles.mapBtn} onPress={() => router.push('/map')}>
  <Text style={styles.mapBtnText}>🗺️ Öppna karta</Text>
</Pressable>
```

Styles:
```tsx
mapBtn: { marginHorizontal: 16, padding: 12, borderRadius: 8, backgroundColor: '#F1EFE8', alignItems: 'center', marginBottom: 8 },
mapBtnText: { color: '#0F6E56', fontSize: 14, fontWeight: '500' },
```

## Verifiering
- [ ] `pnpm install` klart (nya deps installerade)
- [ ] Kartan renderas när man öppnar /map
- [ ] Markers visas på rätt städer
- [ ] Klick på marker visar popup
- [ ] "Öppna klubb"-knapp navigerar till `/club/[id]`

## Anti-patterns
- Använd INTE `@rnmapbox/maps` — det är Mapbox (inte MapLibre). Olika paket.
- Glöm INTE `logoEnabled={false}` — annars visas MapLibre-logo stort i hörnet
- För riktig produktion: byt `demotiles.maplibre.org/style.json` till MapTiler/Stadia för bättre kvalitet

## Known caveats
- Expo Go stödjer kanske INTE native MapLibre module — kan kräva dev-client (`npx expo run:android`)
- Om Expo Go failar: nämn i POST-FLIGHT att Zivar behöver bygga en dev-client

## Commit
`BRIEF-UI-016: MapLibre map with club markers`

## Rollback
```bash
git checkout apps/mobile/lib/data.ts
git checkout apps/mobile/app/(tabs)/index.tsx
rm apps/mobile/app/map.tsx
cd apps/mobile && pnpm remove @maplibre/maplibre-react-native
```

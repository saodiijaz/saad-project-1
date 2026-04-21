# BRIEF-UI-025: "Nära mig"-sortering i Upptäck (GPS)

## Status
✅ READY — använder `expo-location` (vanlig i Expo managed workflow).

## Mål
Lägg till ett fjärde sort-val i Discover: **Nära mig**. När valt, begär GPS-permission, hämta användarens position, och sortera klubbar efter hur nära stadens koordinater ligger.

## Blockerad av
Inget funktionellt — BRIEF-DB-007 (cities lat/lng) redan klar. Kräver `expo-location` i `package.json`.

## Berörda filer
- `apps/mobile/package.json` — ny dep `expo-location`
- `apps/mobile/lib/geo.ts` — ny helper: `haversineKm(lat1, lng1, lat2, lng2)` + `getUserLocation()`
- `apps/mobile/lib/data.ts` — utöka `ClubSort` med `'nearby'`, skicka lat/lng till `getClubs`
- `apps/mobile/app/(tabs)/index.tsx` — lägg till "Nära mig"-chip

## Steg

### 1. `lib/geo.ts`:
- `haversineKm` — klassisk formula
- `getUserLocation()` — wrapper runt `Location.getCurrentPositionAsync` med permission-request

### 2. `lib/data.ts`:
- `ClubSort` → lägg till `'nearby'`
- `getClubs(sort, userLat?, userLng?)` — om `sort === 'nearby'` och koord finns, sortera på avstånd till klubbens stad (cities join).
- Returnera `distance_km?` på `Club` för UI-visning.

### 3. `(tabs)/index.tsx`:
- Ny chip "Nära mig"
- På tryck: begär GPS, sätt `sortBy = 'nearby'`, anropa `getClubs('nearby', lat, lng)`
- Visa avstånd på klubbkortet om det finns

## Verifiering
- [ ] Tryck "Nära mig" → GPS-permission-prompt
- [ ] Acceptera → klubbar sorteras nära → långt
- [ ] Avstånd visas (ex: `2.1 km`)
- [ ] Neka permission → fallback till "Populärast"

## Anti-patterns
- Spara INTE GPS-koordinater — använd one-shot `getCurrentPositionAsync`
- Hårdkoda INTE fallback-position — fallback ska vara till en annan sort

## Commit
`BRIEF-UI-025: Nearby sort using GPS + haversine (adds expo-location dep)`

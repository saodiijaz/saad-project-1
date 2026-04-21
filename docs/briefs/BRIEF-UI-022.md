# BRIEF-UI-022: Pull-to-refresh överallt

## Mål
Varje lista som visar data (flöde, events, vänner, följare) ska stödja pull-to-refresh — user drar ner listan, släpper, data laddas om.

## Kontext
Feed + Events har redan RefreshControl. Discover, Friends, Followers har det inte. Lägg till det där.

## Blockerad av
Inget. RefreshControl är inbyggt i React Native.

## Berörda filer
- `apps/mobile/app/(tabs)/index.tsx` — Discover
- `apps/mobile/app/friends.tsx` — alla 3 tabs
- `apps/mobile/app/club/[id]/followers.tsx` — followers list

## Steg

### 1. Discover — i `apps/mobile/app/(tabs)/index.tsx`:

Lägg till state + wrap FlatList med RefreshControl:
```tsx
import { RefreshControl } from 'react-native'

const [refreshing, setRefreshing] = useState(false)

async function onRefresh() {
  setRefreshing(true)
  try {
    const [cl, ci] = await Promise.all([getClubs(), getCities()])
    setClubs(cl); setCities(ci)
  } finally {
    setRefreshing(false)
  }
}

// I FlatList:
<FlatList
  // ... existing props
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F6E56']} tintColor="#0F6E56" />}
/>
```

### 2. Friends — i `apps/mobile/app/friends.tsx`:

Varje FlatList (Vänner, Förfrågningar, Sök) bör ha RefreshControl. Men sök behöver det inte (uppdateras vid query-ändring). Så lägg till på Vänner + Förfrågningar:
```tsx
const [refreshing, setRefreshing] = useState(false)

async function onRefresh() {
  setRefreshing(true)
  try { await loadAll() } finally { setRefreshing(false) }
}

// I FlatList för friends-tab:
refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F6E56']} tintColor="#0F6E56" />}
```

Samma för requests-tab.

### 3. Followers — i `apps/mobile/app/club/[id]/followers.tsx`:

```tsx
const [refreshing, setRefreshing] = useState(false)

async function onRefresh() {
  if (!id) return
  setRefreshing(true)
  try { setFollowers(await getClubFollowers(id)) }
  finally { setRefreshing(false) }
}

// I FlatList:
refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F6E56']} tintColor="#0F6E56" />}
```

## Verifiering
- [ ] Dra ner i Discover → spinner syns → data laddas om
- [ ] Dra ner i Friends (Vänner-tab) → listan uppdateras
- [ ] Dra ner i Followers → listan uppdateras
- [ ] Spinner-färg matchar appens primärfärg (grön)

## Anti-patterns
- Glöm INTE `setRefreshing(false)` i finally — annars hänger spinnern kvar
- Använd INTE `onRefresh={load}` direkt utan wrapper — då saknas `setRefreshing(true)`

## Commit
`BRIEF-UI-022: Pull-to-refresh on lists`

## Rollback
Git checkout de 3 filerna

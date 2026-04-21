# BRIEF-UI-014: Föreningsadmin — följarlista

## Mål
Om user är admin för en klubb ska det finnas en "Följare"-knapp på klubbsidan som öppnar en lista av alla som följer föreningen.

## Berörda filer
- `apps/mobile/lib/data.ts` — getClubFollowers
- `apps/mobile/app/club/[id]/followers.tsx` — ny
- `apps/mobile/app/club/[id].tsx` — lägg till länk/räknare för admin

## Steg

### 1. Lägg till i `apps/mobile/lib/data.ts`:
```typescript
export async function getClubFollowers(clubId: string): Promise<FriendUser[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('follows')
    .select('user:user_id(id, display_name, email, avatar_url, city)')
    .eq('club_id', clubId)
  if (error) throw error
  return (data ?? []).map((r: any) => r.user).filter(Boolean) as FriendUser[]
}

export async function getClubFollowerCount(clubId: string): Promise<number> {
  if (!supabase) return 0
  const { count } = await supabase
    .from('follows').select('*', { count: 'exact', head: true }).eq('club_id', clubId)
  return count ?? 0
}
```

### 2. Skapa `apps/mobile/app/club/[id]/followers.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { getClubFollowers, FriendUser } from '../../../lib/data'

export default function ClubFollowers() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [followers, setFollowers] = useState<FriendUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getClubFollowers(id).then(setFollowers).finally(() => setLoading(false))
  }, [id])

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Följare (${followers.length})` }} />
      <FlatList
        data={followers}
        keyExtractor={u => u.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>Inga följare än</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.ph]}>
                <Text style={styles.letter}>{(item.display_name ?? item.email)[0].toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.display_name ?? item.email}</Text>
              {item.city && <Text style={styles.sub}>{item.city}</Text>}
            </View>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f3f3f3' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1EFE8' },
  ph: { justifyContent: 'center', alignItems: 'center' },
  letter: { fontSize: 18, color: '#0F6E56', fontWeight: '600' },
  name: { fontSize: 15, fontWeight: '500' },
  sub: { fontSize: 13, color: '#666' },
})
```

### 3. I `apps/mobile/app/club/[id].tsx`, om admin, visa antal följare + gör det klickbart:
```tsx
// Lägg till state
const [followerCount, setFollowerCount] = useState(0)

// I useEffect:
getClubFollowerCount(id).then(setFollowerCount)

// I JSX under admin-knapparna:
{admin && (
  <Pressable style={styles.adminBtn} onPress={() => router.push(`/club/${id}/followers`)}>
    <Text style={styles.adminBtnText}>👥 {followerCount} följare</Text>
  </Pressable>
)}
```

Importera `getClubFollowerCount` från data.

## Verifiering
- [ ] `pnpm typecheck` grönt
- [ ] Lista visas för admin med avatar + namn + stad
- [ ] Räknar korrekt antal följare

## Anti-patterns
- RLS på follows-tabell tillåter redan read — ingen ny policy behövs
- Om du ser alla följare utan att vara admin är det OK (MVP) — men långsiktigt bör följarlista begränsas

## Commit
`BRIEF-UI-014: Club admin followers list`

## Rollback
Git checkout + ta bort followers.tsx

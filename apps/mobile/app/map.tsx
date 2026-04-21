import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { getClubsForMap, MapClub } from '../lib/data'

// NOTE: MapLibre (@maplibre/maplibre-react-native) is a native module that
// requires a prebuild step (not compatible with plain Expo Go). Until Zivar
// runs `npx expo prebuild` + rebuilds the native app, we render a lightweight
// fallback list view of clubs with their city coordinates. The map UI should
// drop in here once the native module is wired up.

export default function MapScreen() {
  const router = useRouter()
  const [clubs, setClubs] = useState<MapClub[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getClubsForMap()
      .then(setClubs)
      .catch(err => setError(err?.message ?? 'Kunde inte ladda klubbar'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Karta' }} />
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          🗺️ Kartvyn kräver en native build (MapLibre). Tills dess visas föreningar som lista.
        </Text>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={clubs}
        keyExtractor={c => c.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Inga klubbar med koordinater än. Lägg till städer med lat/lng så dyker de upp här.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/club/${item.id}`)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>{item.city} · {item.sports.join(', ')}</Text>
            <Text style={styles.coords}>
              📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  notice: { backgroundColor: '#FAEEDA', padding: 10 },
  noticeText: { textAlign: 'center', color: '#854F0B', fontSize: 12 },
  error: { color: '#d33', padding: 16, textAlign: 'center' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  card: {
    padding: 14,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  sub: { fontSize: 13, color: '#666', marginBottom: 4 },
  coords: { fontSize: 12, color: '#0F6E56' },
})

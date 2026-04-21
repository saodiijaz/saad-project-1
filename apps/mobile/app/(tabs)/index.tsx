import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { getClubs } from '../../lib/data'
import { Club } from '../../lib/types'
import { hasSupabaseConfig } from '../../lib/supabase'

export default function Discover() {
  const router = useRouter()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    getClubs()
      .then(setClubs)
      .catch(err => console.error('Failed to load clubs', err))
      .finally(() => setLoading(false))
  }, [])

  const filtered = clubs.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.sports.some(s => s.toLowerCase().includes(query.toLowerCase()))
  )

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />

  return (
    <View style={styles.container}>
      {!hasSupabaseConfig && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Demo-läge: visar mock-data</Text>
        </View>
      )}
      <TextInput
        placeholder="Sök förening eller sport…"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/club/${item.id}`)}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.city}>{item.city} · {item.sports.join(', ')}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
          </Pressable>
        )}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  banner: { backgroundColor: '#FAEEDA', padding: 8 },
  bannerText: { textAlign: 'center', color: '#854F0B', fontSize: 12 },
  search: {
    margin: 16, marginBottom: 0, padding: 12,
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, fontSize: 16,
  },
  card: {
    padding: 16, borderWidth: 1, borderColor: '#eee', borderRadius: 12,
    backgroundColor: '#fafafa',
  },
  name: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  city: { fontSize: 13, color: '#666', marginBottom: 8 },
  desc: { fontSize: 14, color: '#333', lineHeight: 20 },
})

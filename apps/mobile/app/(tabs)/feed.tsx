import { useState, useCallback, useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { getFeed, FeedPost } from '../../lib/data'

export default function Feed() {
  const router = useRouter()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const p = await getFeed()
      setPosts(p)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <View style={styles.container}><Text style={styles.empty}>Laddar…</Text></View>

  if (posts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>
          Följ föreningar i Upptäck för att se deras inlägg här.
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={p => p.id}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/club/${item.club.id}`)}>
          <Text style={styles.clubName}>{item.club.name}</Text>
          <Text style={styles.title}>{item.title}</Text>
          {item.event_at && (
            <Text style={styles.date}>
              {new Date(item.event_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
              {item.location && ` · ${item.location}`}
            </Text>
          )}
          <Text style={styles.body} numberOfLines={3}>{item.body}</Text>
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  empty: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  card: { padding: 14, backgroundColor: '#fafafa', borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  clubName: { fontSize: 13, color: '#0F6E56', fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  date: { fontSize: 13, color: '#666', marginBottom: 6 },
  body: { fontSize: 14, color: '#333', lineHeight: 20 },
})

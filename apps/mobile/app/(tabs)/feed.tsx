import { useState, useCallback, useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { getMixedFeed, FeedItem } from '../../lib/data'

export default function Feed() {
  const router = useRouter()
  const [items, setItems] = useState<FeedItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try { setItems(await getMixedFeed()) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <View style={styles.center}><Text style={styles.empty}>Laddar…</Text></View>

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        data={items}
        keyExtractor={i => `${i.source}-${i.post.id}`}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
        ListEmptyComponent={<Text style={styles.empty}>Följ föreningar eller vänner för att se inlägg här.</Text>}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          if (item.source === 'club') {
            const p = item.post
            return (
              <Pressable style={styles.card} onPress={() => router.push(`/club/${p.club.id}`)}>
                <Text style={styles.clubName}>{p.club.name}</Text>
                <Text style={styles.title}>{p.title}</Text>
                <Text style={styles.body} numberOfLines={3}>{p.body}</Text>
              </Pressable>
            )
          }
          const p = item.post
          return (
            <View style={styles.card}>
              <Text style={styles.clubName}>{p.author?.display_name ?? p.author?.email}</Text>
              {p.image_url && <Image source={{ uri: p.image_url }} style={styles.postImage} />}
              <Text style={styles.body}>{p.body}</Text>
            </View>
          )
        }}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/new-user-post')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  empty: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  card: { padding: 14, backgroundColor: '#fafafa', borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  clubName: { fontSize: 13, color: '#0F6E56', fontWeight: '600', marginBottom: 6 },
  title: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  body: { fontSize: 14, color: '#333', lineHeight: 20 },
  postImage: { width: '100%', height: 220, borderRadius: 8, marginBottom: 8 },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0F6E56', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
})

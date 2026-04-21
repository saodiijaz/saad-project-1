import { useState, useCallback, useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { getMixedFeed, FeedItem, getLikeState, toggleLike, getCommentCount, PostType } from '../../lib/data'
import { EmptyState } from '../../components/EmptyState'
import { SkeletonList } from '../../components/SkeletonCard'
import { PressableScale } from '../../components/PressableScale'
import { hapticLight } from '../../lib/haptics'

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

  if (loading) return <SkeletonList count={5} />

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        data={items}
        keyExtractor={i => `${i.source}-${i.post.id}`}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
        ListEmptyComponent={
          <EmptyState
            emoji="📣"
            title="Inget i flödet ännu"
            description="Följ föreningar i Upptäck eller lägg till vänner för att fylla flödet."
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          if (item.source === 'club') {
            const p = item.post
            return (
              <View style={styles.card}>
                <PressableScale onPress={() => router.push(`/club/${p.club.id}`)}>
                  <Text style={styles.clubName}>{p.club.name}</Text>
                  <Text style={styles.title}>{p.title}</Text>
                  <Text style={styles.body} numberOfLines={3}>{p.body}</Text>
                </PressableScale>
                <PostActions type="club" id={p.id} />
              </View>
            )
          }
          const p = item.post
          return (
            <View style={styles.card}>
              <Text style={styles.clubName}>{p.author?.display_name ?? p.author?.email}</Text>
              {p.image_url && <Image source={{ uri: p.image_url }} style={styles.postImage} />}
              <Text style={styles.body}>{p.body}</Text>
              <PostActions type="user" id={p.id} />
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

export function PostActions({ type, id }: { type: PostType; id: string }) {
  const router = useRouter()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)

  useEffect(() => {
    getLikeState(type, id).then(s => { setLiked(s.liked); setLikeCount(s.count) })
    getCommentCount(type, id).then(setCommentCount)
  }, [type, id])

  async function doLike() {
    const was = liked
    setLiked(!was)
    setLikeCount(c => c + (was ? -1 : 1))
    if (!was) hapticLight()
    try {
      const now = await toggleLike(type, id)
      setLiked(now) // sync
    } catch {
      // revert on failure
      setLiked(was); setLikeCount(c => c + (was ? 1 : -1))
    }
  }

  return (
    <View style={actionStyles.row}>
      <Pressable style={actionStyles.btn} onPress={doLike}>
        <Text style={[actionStyles.icon, liked && actionStyles.iconActive]}>{liked ? '♥' : '♡'}</Text>
        <Text style={actionStyles.count}>{likeCount}</Text>
      </Pressable>
      <Pressable style={actionStyles.btn} onPress={() => router.push(`/post/${type}/${id}`)}>
        <Text style={actionStyles.icon}>💬</Text>
        <Text style={actionStyles.count}>{commentCount}</Text>
      </Pressable>
    </View>
  )
}

const actionStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 20, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { fontSize: 20, color: '#666' },
  iconActive: { color: '#d33' },
  count: { fontSize: 14, color: '#666' },
})

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

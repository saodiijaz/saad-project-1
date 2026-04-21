import { useState, useCallback, useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { getUpcomingEvents, Event } from '../../lib/data'
import { EmptyState } from '../../components/EmptyState'
import { SkeletonList } from '../../components/SkeletonCard'
import { PressableScale } from '../../components/PressableScale'

export default function Events() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try { setEvents(await getUpcomingEvents()) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <SkeletonList count={5} />

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        data={events}
        keyExtractor={e => e.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
        ListEmptyComponent={
          <EmptyState
            emoji="📅"
            title="Inga kommande events"
            description="Det finns inga events just nu. Skapa det första!"
            actionLabel="+ Skapa event"
            onAction={() => router.push('/event/new')}
          />
        }
        renderItem={({ item }) => (
          <PressableScale style={styles.card} onPress={() => router.push(`/event/${item.id}`)}>
            {item.club && <Text style={styles.clubName}>{item.club.name}</Text>}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.date}>
              {new Date(item.starts_at).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              {item.location && ` · ${item.location}`}
            </Text>
            <Text style={styles.body} numberOfLines={2}>{item.description}</Text>
          </PressableScale>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/event/new')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 15 },
  card: { padding: 14, backgroundColor: '#fafafa', borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  clubName: { fontSize: 13, color: '#0F6E56', fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  date: { fontSize: 13, color: '#666', marginBottom: 6 },
  body: { fontSize: 14, color: '#333', lineHeight: 20 },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0F6E56', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
})

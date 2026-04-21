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

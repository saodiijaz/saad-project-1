import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, Alert, Image } from 'react-native'
import { Stack } from 'expo-router'
import {
  searchUsers, sendFriendRequest, getFriends, getPendingRequests,
  respondToFriendRequest, removeFriend, FriendUser, FriendRequest,
} from '../lib/data'

type Tab = 'friends' | 'requests' | 'search'

export default function FriendsScreen() {
  const [tab, setTab] = useState<Tab>('friends')
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FriendUser[]>([])

  const loadAll = useCallback(async () => {
    const [f, r] = await Promise.all([getFriends(), getPendingRequests()])
    setFriends(f); setRequests(r)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    if (tab !== 'search') return
    const t = setTimeout(() => {
      searchUsers(searchQuery).then(setSearchResults)
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery, tab])

  async function handleSendRequest(userId: string) {
    try {
      await sendFriendRequest(userId)
      Alert.alert('Skickat', 'Vänförfrågan skickad')
    } catch (e: any) { Alert.alert('Fel', e?.message ?? 'Kunde inte skicka') }
  }

  async function handleRespond(id: string, accept: boolean) {
    try {
      await respondToFriendRequest(id, accept)
      loadAll()
    } catch (e: any) { Alert.alert('Fel', e?.message ?? 'Kunde inte svara') }
  }

  async function handleRemove(userId: string) {
    Alert.alert('Ta bort vän?', '', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Ta bort', style: 'destructive', onPress: async () => {
        await removeFriend(userId); loadAll()
      }},
    ])
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Vänner' }} />
      <View style={styles.tabBar}>
        {(['friends','requests','search'] as Tab[]).map(t => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'friends' ? `Vänner (${friends.length})` : t === 'requests' ? `Förfrågningar (${requests.length})` : 'Sök'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'friends' && (
        <FlatList
          data={friends}
          keyExtractor={u => u.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>Inga vänner än. Sök upp någon!</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <UserAvatar user={item} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.display_name ?? item.email}</Text>
                {item.city && <Text style={styles.sub}>{item.city}</Text>}
              </View>
              <Pressable onPress={() => handleRemove(item.id)}>
                <Text style={styles.removeText}>Ta bort</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      {tab === 'requests' && (
        <FlatList
          data={requests}
          keyExtractor={r => r.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.empty}>Inga vänförfrågningar</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <UserAvatar user={item.from} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.from.display_name ?? item.from.email}</Text>
              </View>
              <Pressable style={styles.acceptBtn} onPress={() => handleRespond(item.id, true)}>
                <Text style={styles.acceptText}>Acceptera</Text>
              </Pressable>
              <Pressable onPress={() => handleRespond(item.id, false)}>
                <Text style={styles.declineText}>Avslå</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      {tab === 'search' && (
        <>
          <TextInput
            style={styles.search}
            placeholder="Sök på namn eller email…"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FlatList
            data={searchResults}
            keyExtractor={u => u.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<Text style={styles.empty}>{searchQuery.length < 2 ? 'Skriv minst 2 tecken' : 'Inga resultat'}</Text>}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <UserAvatar user={item} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.display_name ?? item.email}</Text>
                  {item.city && <Text style={styles.sub}>{item.city}</Text>}
                </View>
                <Pressable style={styles.addBtn} onPress={() => handleSendRequest(item.id)}>
                  <Text style={styles.addText}>+ Lägg till</Text>
                </Pressable>
              </View>
            )}
          />
        </>
      )}
    </View>
  )
}

function UserAvatar({ user }: { user: FriendUser }) {
  if (user.avatar_url) return <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
  return (
    <View style={[styles.avatar, styles.avatarPlaceholder]}>
      <Text style={styles.avatarLetter}>
        {(user.display_name ?? user.email)[0].toUpperCase()}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, padding: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#0F6E56' },
  tabText: { fontSize: 14, color: '#666' },
  tabTextActive: { color: '#0F6E56', fontWeight: '600' },
  search: { margin: 16, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, fontSize: 16 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f3f3f3', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1EFE8' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 18, color: '#0F6E56', fontWeight: '600' },
  name: { fontSize: 15, fontWeight: '500', color: '#222' },
  sub: { fontSize: 13, color: '#666' },
  addBtn: { backgroundColor: '#0F6E56', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  addText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  acceptBtn: { backgroundColor: '#0F6E56', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginRight: 8 },
  acceptText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  declineText: { color: '#999', fontSize: 13, padding: 8 },
  removeText: { color: '#d33', fontSize: 13, padding: 8 },
})

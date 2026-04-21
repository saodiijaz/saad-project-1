# BRIEF-UI-010: Vänsystem UI (lägg till/vänlista)

## Mål
User kan söka upp andra användare, skicka vänförfrågan, acceptera/avslå mottagna förfrågningar, se sin vänlista.

## Blockerad av
BRIEF-DB-004 (friendships-tabell måste finnas). Om migration 009 inte är körd → markera BLOCKED.

## Berörda filer
- `apps/mobile/lib/data.ts` — friends-helpers
- `apps/mobile/app/friends.tsx` — friends-skärm (tabs: Vänner / Förfrågningar / Sök)
- `apps/mobile/app/(tabs)/profile.tsx` — knapp "Mina vänner" som navigerar till /friends

## Steg

### 1. Lägg till i `apps/mobile/lib/data.ts`:
```typescript
export type FriendUser = {
  id: string
  display_name: string | null
  email: string
  avatar_url: string | null
  city: string | null
}

export type FriendRequest = {
  id: string
  from: FriendUser
  created_at: string
}

export async function searchUsers(query: string): Promise<FriendUser[]> {
  if (!supabase || query.trim().length < 2) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, email, avatar_url, city')
    .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
    .neq('id', session.user.id)
    .limit(20)
  if (error) throw error
  return (data ?? []) as FriendUser[]
}

export async function sendFriendRequest(addresseeId: string): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const { error } = await supabase.from('friendships').insert({
    requester_id: session.user.id,
    addressee_id: addresseeId,
    status: 'pending',
  })
  if (error && error.code !== '23505') throw error // ignore duplicate
}

export async function getFriends(): Promise<FriendUser[]> {
  if (!supabase) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  const uid = session.user.id

  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, requester:requester_id(id, display_name, email, avatar_url, city), addressee:addressee_id(id, display_name, email, avatar_url, city)')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`)
  if (error) throw error

  return (data ?? []).map((f: any) => (f.requester_id === uid ? f.addressee : f.requester))
}

export async function getPendingRequests(): Promise<FriendRequest[]> {
  if (!supabase) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const { data, error } = await supabase
    .from('friendships')
    .select('id, created_at, requester:requester_id(id, display_name, email, avatar_url, city)')
    .eq('status', 'pending')
    .eq('addressee_id', session.user.id)
    .order('created_at', { ascending: false })
  if (error) throw error

  return (data ?? []).map((r: any) => ({ id: r.id, from: r.requester, created_at: r.created_at }))
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('friendships')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', friendshipId)
  if (error) throw error
}

export async function removeFriend(friendUserId: string): Promise<void> {
  if (!supabase) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  await supabase
    .from('friendships')
    .delete()
    .or(`and(requester_id.eq.${session.user.id},addressee_id.eq.${friendUserId}),and(requester_id.eq.${friendUserId},addressee_id.eq.${session.user.id})`)
}
```

### 2. Skapa `apps/mobile/app/friends.tsx`:
```tsx
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
```

### 3. I `apps/mobile/app/(tabs)/profile.tsx` — lägg till knapp "Mina vänner" som navigerar till `/friends`.

## Verifiering
- [ ] `pnpm typecheck` grönt
- [ ] `/friends`-skärmen öppnas från profilen
- [ ] Sök-tab filtrerar användare efter 2+ tecken
- [ ] Accepted-förfrågan visas i Vänner-tabben

## Anti-patterns
- Använd INTE `ilike '%...%'` för lookup i produktion — skalar dåligt. MVP-OK.
- Glöm INTE att filtrera bort sig själv i searchUsers (`.neq('id', session.user.id)`)
- OR-queryn i removeFriend kräver rätt syntax — Supabase stödjer `and(...)` nestat inuti `or()`

## Commit
`BRIEF-UI-010: Friends system UI`

## Rollback
```bash
git checkout apps/mobile/lib/data.ts
git rm apps/mobile/app/friends.tsx
git checkout apps/mobile/app/(tabs)/profile.tsx
```

# BRIEF-UI-011: User posts UI (skapa + visa i flöde)

## Mål
Användare kan skapa egna posts (bild + text) från Flöde-fliken. Feed blandar club_posts och user_posts kronologiskt.

## Blockerad av
BRIEF-DB-005 (user_posts-tabell), storage-bucket `user-posts` manuellt skapad av Zivar.

## Berörda filer
- `apps/mobile/lib/data.ts` — user-post helpers + utökad getFeed
- `apps/mobile/app/new-user-post.tsx` — skapa-skärm
- `apps/mobile/app/(tabs)/feed.tsx` — visa blandad feed + FAB

## Steg

### 1. Lägg till i `apps/mobile/lib/data.ts`:
```typescript
export type UserPost = {
  id: string
  author_id: string
  body: string
  image_url: string | null
  created_at: string
  author?: { id: string; display_name: string | null; avatar_url: string | null; email: string }
}

// Unified feed item — diskrimineras på source
export type FeedItem =
  | { source: 'club'; post: FeedPost }
  | { source: 'user'; post: UserPost }

export async function uploadUserPostImage(uri: string): Promise<string> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const response = await fetch(uri)
  const blob = await response.blob()
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${session.user.id}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('user-posts').upload(path, blob, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` })
  if (error) throw error
  return supabase.storage.from('user-posts').getPublicUrl(path).data.publicUrl
}

export async function createUserPost(p: { body: string; imageUrl?: string }): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const { error } = await supabase.from('user_posts').insert({
    author_id: session.user.id,
    body: p.body,
    image_url: p.imageUrl ?? null,
  })
  if (error) throw error
}

export async function getUserPosts(limit = 50): Promise<UserPost[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('user_posts')
    .select('*, author:author_id(id, display_name, avatar_url, email)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as UserPost[]
}

// Blandad feed — club_posts (från följda) + user_posts (alla) — kronologiskt
export async function getMixedFeed(): Promise<FeedItem[]> {
  const [club, user] = await Promise.all([getFeed(), getUserPosts()])
  const items: FeedItem[] = [
    ...club.map(p => ({ source: 'club' as const, post: p })),
    ...user.map(p => ({ source: 'user' as const, post: p })),
  ]
  return items.sort((a, b) =>
    new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime()
  )
}
```

### 2. Skapa `apps/mobile/app/new-user-post.tsx`:
```tsx
import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView, Image } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { createUserPost, uploadUserPostImage } from '../lib/data'

export default function NewUserPost() {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { Alert.alert('Tillåt galleri-åtkomst'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7,
    })
    if (!result.canceled) setImageUri(result.assets[0].uri)
  }

  async function submit() {
    if (!body.trim() && !imageUri) { Alert.alert('Skriv något eller lägg till bild'); return }
    setBusy(true)
    try {
      let imageUrl: string | undefined
      if (imageUri) imageUrl = await uploadUserPostImage(imageUri)
      await createUserPost({ body: body.trim(), imageUrl })
      router.back()
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte posta')
    } finally { setBusy(false) }
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Nytt inlägg' }} />
      <TextInput
        style={styles.input}
        placeholder="Vad vill du dela?"
        value={body}
        onChangeText={setBody}
        multiline
      />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
      <Pressable style={styles.imageBtn} onPress={pickImage}>
        <Text style={styles.imageBtnText}>{imageUri ? 'Byt bild' : '📷 Lägg till bild'}</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={submit} disabled={busy}>
        <Text style={styles.btnText}>{busy ? '…' : 'Publicera'}</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, minHeight: 120, textAlignVertical: 'top' },
  preview: { width: '100%', height: 200, borderRadius: 8, marginTop: 12 },
  imageBtn: { padding: 12, borderWidth: 1, borderColor: '#0F6E56', borderRadius: 8, alignItems: 'center', marginTop: 12 },
  imageBtnText: { color: '#0F6E56', fontSize: 15 },
  btn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
})
```

### 3. Uppdatera `apps/mobile/app/(tabs)/feed.tsx` — använd `getMixedFeed` och rendera olika kort beroende på `source`:
```tsx
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
```

## Verifiering
- [ ] `pnpm typecheck` grönt
- [ ] FAB + på Flöde-fliken öppnar new-user-post
- [ ] Nya posts syns kronologiskt blandade med club posts

## Anti-patterns
- Diskriminerat union (`source: 'club' | 'user'`) gör TS-säker rendering
- Ladda INTE stora bilder utan komprimering (`quality: 0.7`)

## Commit
`BRIEF-UI-011: User posts creation and mixed feed`

## Rollback
Git checkout alla ändrade filer + ta bort new-user-post.tsx

# BRIEF-UI-012: Kommentarer + likes UI

## Mål
Visa hjärta + kommentar-knapp på varje post i feeden. Klick på hjärta togglar like. Klick på kommentar öppnar post-detalj-sida där man ser och skriver kommentarer.

## Blockerad av
BRIEF-DB-006 (tabeller post_comments + post_likes).

## Berörda filer
- `apps/mobile/lib/data.ts` — comment/like helpers
- `apps/mobile/app/(tabs)/feed.tsx` — lägg till knappar per kort
- `apps/mobile/app/post/[type]/[id].tsx` — post-detaljsida med kommentarer

## Steg

### 1. Lägg till i `apps/mobile/lib/data.ts`:
```typescript
export type PostType = 'club' | 'user'

export type Comment = {
  id: string
  post_type: PostType
  post_id: string
  author_id: string
  body: string
  created_at: string
  author?: { id: string; display_name: string | null; avatar_url: string | null; email: string }
}

export async function getComments(postType: PostType, postId: string): Promise<Comment[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('post_comments')
    .select('*, author:author_id(id, display_name, avatar_url, email)')
    .eq('post_type', postType).eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Comment[]
}

export async function addComment(postType: PostType, postId: string, body: string): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const { error } = await supabase.from('post_comments').insert({
    post_type: postType, post_id: postId, author_id: session.user.id, body: body.trim(),
  })
  if (error) throw error
}

export async function deleteComment(commentId: string): Promise<void> {
  if (!supabase) return
  await supabase.from('post_comments').delete().eq('id', commentId)
}

export async function getLikeState(postType: PostType, postId: string): Promise<{ liked: boolean; count: number }> {
  if (!supabase) return { liked: false, count: 0 }
  const { data: { session } } = await supabase.auth.getSession()
  const [likedRes, countRes] = await Promise.all([
    session ? supabase.from('post_likes').select('user_id').eq('post_type', postType).eq('post_id', postId).eq('user_id', session.user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_type', postType).eq('post_id', postId),
  ])
  return { liked: !!likedRes.data, count: countRes.count ?? 0 }
}

export async function toggleLike(postType: PostType, postId: string): Promise<boolean> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')

  const { data: existing } = await supabase
    .from('post_likes').select('user_id')
    .eq('post_type', postType).eq('post_id', postId).eq('user_id', session.user.id).maybeSingle()

  if (existing) {
    await supabase.from('post_likes').delete()
      .eq('post_type', postType).eq('post_id', postId).eq('user_id', session.user.id)
    return false
  } else {
    await supabase.from('post_likes').insert({
      post_type: postType, post_id: postId, user_id: session.user.id,
    })
    return true
  }
}

export async function getCommentCount(postType: PostType, postId: string): Promise<number> {
  if (!supabase) return 0
  const { count } = await supabase.from('post_comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_type', postType).eq('post_id', postId)
  return count ?? 0
}
```

### 2. I `apps/mobile/app/(tabs)/feed.tsx` — lägg till en `<PostActions />`-komponent under varje kort:

```tsx
import { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { getLikeState, toggleLike, getCommentCount, PostType } from '../../lib/data'
import { useRouter } from 'expo-router'

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
```

Lägg `<PostActions type="club" id={p.id} />` eller `<PostActions type="user" id={p.id} />` i slutet av varje kort i Feed.

### 3. Skapa `apps/mobile/app/post/[type]/[id].tsx`:
```tsx
import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Alert, Image } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { getComments, addComment, Comment, PostType } from '../../../lib/data'

export default function PostDetail() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>()
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const postType = (type === 'club' ? 'club' : 'user') as PostType

  const load = useCallback(async () => {
    if (!id) return
    setComments(await getComments(postType, id))
  }, [id, postType])

  useEffect(() => { load() }, [load])

  async function submit() {
    if (!id || !body.trim()) return
    setBusy(true)
    try {
      await addComment(postType, id, body)
      setBody('')
      await load()
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte kommentera')
    } finally { setBusy(false) }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Kommentarer' }} />
      <FlatList
        data={comments}
        keyExtractor={c => c.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>Inga kommentarer än. Var först!</Text>}
        renderItem={({ item }) => (
          <View style={styles.comment}>
            {item.author?.avatar_url ? (
              <Image source={{ uri: item.author.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPh]}>
                <Text style={styles.avatarLetter}>{(item.author?.display_name ?? item.author?.email ?? '?')[0].toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.author}>{item.author?.display_name ?? item.author?.email}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          </View>
        )}
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Skriv en kommentar…"
          value={body}
          onChangeText={setBody}
          multiline
        />
        <Pressable style={styles.send} onPress={submit} disabled={busy || !body.trim()}>
          <Text style={styles.sendText}>Skicka</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  comment: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f3f3' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1EFE8' },
  avatarPh: { justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 15, color: '#0F6E56', fontWeight: '600' },
  author: { fontSize: 13, color: '#0F6E56', fontWeight: '600', marginBottom: 2 },
  body: { fontSize: 14, color: '#333', lineHeight: 20 },
  inputBar: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'flex-end' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  send: { marginLeft: 8, paddingHorizontal: 14, paddingVertical: 10 },
  sendText: { color: '#0F6E56', fontWeight: '600' },
})
```

## Verifiering
- [ ] `pnpm typecheck` grönt
- [ ] Hjärta togglar och räknas korrekt (optimistic update med revert)
- [ ] Kommentarssidan öppnas och tillåter posta

## Anti-patterns
- Undvik race conditions med optimistic update (revertera vid fel)
- Glöm INTE `head: true` på count-queries för prestanda
- Validera `type`-param (bara 'club' eller 'user' tillåtet)

## Commit
`BRIEF-UI-012: Comments and likes UI`

## Rollback
Git checkout feed.tsx + data.ts, ta bort post/[type]/[id].tsx

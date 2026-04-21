import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Alert, Image } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { getComments, addComment, Comment, PostType } from '../../../lib/data'
import { hapticMedium, hapticError } from '../../../lib/haptics'

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
      hapticMedium()
      setBody('')
      await load()
    } catch (e: any) {
      hapticError()
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

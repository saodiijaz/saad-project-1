import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { createClubPost } from '../../../lib/data'

export default function NewPost() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [location, setLocation] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!id || !title.trim() || !body.trim()) {
      Alert.alert('Fyll i titel och innehåll'); return
    }
    setBusy(true)
    try {
      await createClubPost({ clubId: id, title: title.trim(), body: body.trim(), location: location.trim() || undefined })
      router.back()
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte skapa post')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Skapa post' }} />
      <Text style={styles.label}>Titel</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />
      <Text style={styles.label}>Innehåll</Text>
      <TextInput style={[styles.input, styles.multiline]} value={body} onChangeText={setBody} multiline />
      <Text style={styles.label}>Plats (valfritt)</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} />
      <Pressable style={styles.btn} onPress={submit} disabled={busy}>
        <Text style={styles.btnText}>{busy ? '…' : 'Publicera'}</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  btn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
})

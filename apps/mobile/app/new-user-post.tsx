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

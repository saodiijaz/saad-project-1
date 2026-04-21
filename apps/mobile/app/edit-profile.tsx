import { useState, useEffect } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView, Image } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { getMyProfile, updateMyProfile, uploadAvatar } from '../lib/data'

export default function EditProfile() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyProfile().then(p => {
      if (p) {
        setDisplayName(p.display_name ?? '')
        setCity(p.city ?? '')
        setAvatarUrl(p.avatar_url ?? null)
      }
    }).finally(() => setLoading(false))
  }, [])

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Tillåt galleri-åtkomst för att ändra profilbild'); return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    })
    if (result.canceled) return
    setUploadingAvatar(true)
    try {
      const url = await uploadAvatar(result.assets[0].uri)
      setAvatarUrl(url)
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte ladda upp bild')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function save() {
    setBusy(true)
    try {
      await updateMyProfile({
        display_name: displayName.trim() || undefined,
        city: city.trim() || undefined,
      })
      router.back()
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte spara')
    } finally { setBusy(false) }
  }

  if (loading) return <View style={styles.container}><Text>Laddar…</Text></View>

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Redigera profil' }} />

      <Pressable style={styles.avatarBox} onPress={pickAvatar} disabled={uploadingAvatar}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>Lägg till bild</Text>
          </View>
        )}
        {uploadingAvatar && <Text style={styles.uploadingText}>Laddar upp…</Text>}
        <Text style={styles.changeText}>{avatarUrl ? 'Byt bild' : 'Välj bild'}</Text>
      </Pressable>

      <Text style={styles.label}>Namn</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
      <Text style={styles.label}>Stad</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} />
      <Pressable style={styles.btn} onPress={save} disabled={busy}>
        <Text style={styles.btnText}>{busy ? '…' : 'Spara'}</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  avatarBox: { alignItems: 'center', marginBottom: 24, marginTop: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1EFE8' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderText: { color: '#888', fontSize: 13 },
  uploadingText: { marginTop: 8, color: '#0F6E56', fontSize: 13 },
  changeText: { marginTop: 8, color: '#0F6E56', fontSize: 14, fontWeight: '500' },
  label: { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  btn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
})

import { useState, useEffect } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { getMyProfile, updateMyProfile } from '../lib/data'

export default function EditProfile() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyProfile().then(p => {
      if (p) {
        setDisplayName(p.display_name ?? '')
        setCity(p.city ?? '')
      }
    }).finally(() => setLoading(false))
  }, [])

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
  label: { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  btn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
})

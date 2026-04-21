import { useState, useEffect } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView, Image } from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { getClubById, updateClub, uploadClubAsset } from '../../../lib/data'

export default function EditClub() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [email, setEmail] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getClubById(id).then(c => {
      if (c) {
        setName(c.name); setDescription(c.description)
        setWebsite(c.website ?? ''); setEmail(c.contact_email ?? '')
        setLogoUrl(c.logo_url); setCoverUrl(c.cover_url)
      }
    }).finally(() => setLoading(false))
  }, [id])

  async function pick(kind: 'logo' | 'cover') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted || !id) { Alert.alert('Tillåt galleri-åtkomst'); return }
    const aspect = kind === 'logo' ? [1, 1] as [number, number] : [16, 9] as [number, number]
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect, quality: 0.8,
    })
    if (result.canceled) return
    try {
      const url = await uploadClubAsset(id, kind, result.assets[0].uri)
      if (kind === 'logo') { setLogoUrl(url); await updateClub(id, { logo_url: url }) }
      else { setCoverUrl(url); await updateClub(id, { cover_url: url }) }
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte ladda upp')
    }
  }

  async function save() {
    if (!id) return
    setBusy(true)
    try {
      await updateClub(id, {
        name: name.trim(),
        description: description.trim(),
        website: website.trim() || undefined,
        contact_email: email.trim() || undefined,
      })
      router.back()
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte spara')
    } finally { setBusy(false) }
  }

  if (loading) return <View style={styles.container}><Text>Laddar…</Text></View>

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Redigera förening' }} />

      <Text style={styles.sectionLabel}>Cover-bild</Text>
      <Pressable style={styles.coverBox} onPress={() => pick('cover')}>
        {coverUrl ? <Image source={{ uri: coverUrl }} style={styles.cover} /> : <Text style={styles.placeholder}>Välj cover</Text>}
      </Pressable>

      <Text style={styles.sectionLabel}>Logo</Text>
      <Pressable style={styles.logoBox} onPress={() => pick('logo')}>
        {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.logo} /> : <Text style={styles.placeholder}>Välj logo</Text>}
      </Pressable>

      <Text style={styles.label}>Namn</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Beskrivning</Text>
      <TextInput style={[styles.input, styles.multi]} value={description} onChangeText={setDescription} multiline />
      <Text style={styles.label}>Hemsida</Text>
      <TextInput style={styles.input} value={website} onChangeText={setWebsite} autoCapitalize="none" />
      <Text style={styles.label}>Kontakt-email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

      <Pressable style={styles.btn} onPress={save} disabled={busy}>
        <Text style={styles.btnText}>{busy ? '…' : 'Spara'}</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  sectionLabel: { fontSize: 14, color: '#666', marginTop: 8, marginBottom: 6 },
  coverBox: { width: '100%', height: 140, borderRadius: 10, backgroundColor: '#F1EFE8', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 12 },
  cover: { width: '100%', height: '100%' },
  logoBox: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F1EFE8', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 12 },
  logo: { width: '100%', height: '100%' },
  placeholder: { color: '#888', fontSize: 13 },
  label: { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  multi: { minHeight: 100, textAlignVertical: 'top' },
  btn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
})

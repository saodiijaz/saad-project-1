import { useState, useEffect } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { createEvent, getMyAdminClubs } from '../../lib/data'
import { hapticSuccess, hapticError } from '../../lib/haptics'

export default function NewEvent() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [clubs, setClubs] = useState<Array<{id:string;name:string}>>([])
  const [clubId, setClubId] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)

  useEffect(() => { getMyAdminClubs().then(setClubs) }, [])

  async function submit() {
    if (!title.trim() || !description.trim() || !startsAt.trim()) {
      Alert.alert('Fyll i titel, beskrivning och starttid'); return
    }
    setBusy(true)
    try {
      const newId = await createEvent({
        title: title.trim(), description: description.trim(),
        location: location.trim() || undefined,
        startsAt: new Date(startsAt).toISOString(),
        clubId,
      })
      hapticSuccess()
      router.replace(`/event/${newId}`)
    } catch (e: any) {
      hapticError()
      Alert.alert('Fel', e?.message ?? 'Kunde inte skapa event')
    } finally { setBusy(false) }
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Skapa event' }} />
      <Text style={styles.label}>Titel</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />
      <Text style={styles.label}>Beskrivning</Text>
      <TextInput style={[styles.input, styles.multi]} value={description} onChangeText={setDescription} multiline />
      <Text style={styles.label}>Plats</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} />
      <Text style={styles.label}>Starttid (YYYY-MM-DD HH:MM)</Text>
      <TextInput style={styles.input} value={startsAt} onChangeText={setStartsAt} placeholder="2026-05-01 18:00" />
      {clubs.length > 0 && (
        <>
          <Text style={styles.label}>Koppla till förening (valfritt)</Text>
          {[{ id: '', name: 'Ingen' }, ...clubs].map(c => (
            <Pressable
              key={c.id || 'none'}
              style={[styles.clubRow, (clubId ?? '') === c.id && styles.clubRowOn]}
              onPress={() => setClubId(c.id || undefined)}
            >
              <Text>{c.name}</Text>
            </Pressable>
          ))}
        </>
      )}
      <Pressable style={styles.btn} onPress={submit} disabled={busy}>
        <Text style={styles.btnText}>{busy ? '…' : 'Skapa event'}</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  multi: { minHeight: 100, textAlignVertical: 'top' },
  clubRow: { padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 6 },
  clubRowOn: { borderColor: '#0F6E56', backgroundColor: '#F1EFE8' },
  btn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
})

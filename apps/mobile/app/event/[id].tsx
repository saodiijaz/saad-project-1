import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { getEventById, isAttendingEvent, joinEvent, leaveEvent, Event } from '../../lib/data'

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [ev, setEv] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [attending, setAttending] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    getEventById(id).then(setEv).finally(() => setLoading(false))
    isAttendingEvent(id).then(setAttending)
  }, [id])

  async function toggle() {
    if (!id || busy) return
    setBusy(true)
    try {
      if (attending) { await leaveEvent(id); setAttending(false) }
      else { await joinEvent(id); setAttending(true) }
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Något gick fel')
    } finally { setBusy(false) }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />
  if (!ev) return <Text style={{ padding: 20 }}>Event hittades inte</Text>

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: ev.title, headerBackTitle: 'Tillbaka' }} />
      <View style={styles.header}>
        {ev.club && <Text style={styles.clubName}>{ev.club.name}</Text>}
        <Text style={styles.title}>{ev.title}</Text>
        <Text style={styles.date}>
          {new Date(ev.starts_at).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
        </Text>
        {ev.location && <Text style={styles.location}>📍 {ev.location}</Text>}
      </View>
      <View style={styles.body}>
        <Text style={styles.description}>{ev.description}</Text>
        <Pressable
          style={[styles.btn, attending && styles.btnOn]}
          onPress={toggle}
          disabled={busy}
        >
          <Text style={[styles.btnText, attending && styles.btnTextOn]}>
            {busy ? '…' : attending ? 'Anmäld ✓' : 'Anmäl dig'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, backgroundColor: '#F1EFE8' },
  clubName: { fontSize: 13, color: '#0F6E56', fontWeight: '600', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 6 },
  date: { fontSize: 15, color: '#333', marginBottom: 4 },
  location: { fontSize: 14, color: '#555' },
  body: { padding: 20 },
  description: { fontSize: 16, lineHeight: 24, color: '#333', marginBottom: 20 },
  btn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnOn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#0F6E56' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  btnTextOn: { color: '#0F6E56' },
})

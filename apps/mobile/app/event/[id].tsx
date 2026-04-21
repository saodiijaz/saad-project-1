import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Image } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import {
  getEventById, isAttendingEvent, joinEvent, leaveEvent, Event,
  isEventCreator, getFriends, inviteFriend, uninviteFriend, getEventInvitees,
  FriendUser,
} from '../../lib/data'
import { hapticLight, hapticError } from '../../lib/haptics'

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [ev, setEv] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [attending, setAttending] = useState(false)
  const [busy, setBusy] = useState(false)
  const [creator, setCreator] = useState(false)
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set())

  const loadInvites = useCallback(async () => {
    if (!id) return
    const ids = await getEventInvitees(id)
    setInvitedIds(new Set(ids))
  }, [id])

  useEffect(() => {
    if (!id) return
    getEventById(id).then(setEv).finally(() => setLoading(false))
    isAttendingEvent(id).then(setAttending)
    isEventCreator(id).then(async isC => {
      setCreator(isC)
      if (isC) {
        const [fs] = await Promise.all([getFriends(), loadInvites()])
        setFriends(fs)
      }
    })
  }, [id, loadInvites])

  async function toggle() {
    if (!id || busy) return
    setBusy(true)
    try {
      if (attending) { await leaveEvent(id); setAttending(false) }
      else { await joinEvent(id); setAttending(true) }
    } catch (e: any) {
      hapticError()
      Alert.alert('Fel', e?.message ?? 'Något gick fel')
    } finally { setBusy(false) }
  }

  async function toggleInvite(userId: string) {
    if (!id) return
    const already = invitedIds.has(userId)
    try {
      if (already) {
        await uninviteFriend(id, userId)
        setInvitedIds(prev => { const n = new Set(prev); n.delete(userId); return n })
      } else {
        await inviteFriend(id, userId)
        setInvitedIds(prev => new Set(prev).add(userId))
        hapticLight()
      }
    } catch (e: any) {
      hapticError()
      Alert.alert('Fel', e?.message ?? 'Kunde inte uppdatera inbjudan')
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />
  if (!ev) return <Text style={{ padding: 20 }}>Event hittades inte</Text>

  const showInviteSection = creator && ev.is_public === false

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: ev.title, headerBackTitle: 'Tillbaka' }} />
      <View style={styles.header}>
        {ev.club && <Text style={styles.clubName}>{ev.club.name}</Text>}
        <Text style={styles.title}>{ev.title}</Text>
        {!ev.is_public && <Text style={styles.privateTag}>🔒 Privat event</Text>}
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

        {showInviteSection && (
          <View style={styles.inviteSection}>
            <Text style={styles.sectionTitle}>Bjud in vänner</Text>
            {friends.length === 0 ? (
              <Text style={styles.empty}>Du har inga vänner att bjuda in än.</Text>
            ) : (
              friends.map(f => {
                const invited = invitedIds.has(f.id)
                return (
                  <View key={f.id} style={styles.row}>
                    {f.avatar_url ? (
                      <Image source={{ uri: f.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.ph]}>
                        <Text style={styles.letter}>{(f.display_name ?? f.email)[0].toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={styles.name}>{f.display_name ?? f.email}</Text>
                    <Pressable
                      style={[styles.inviteBtn, invited && styles.inviteBtnOn]}
                      onPress={() => toggleInvite(f.id)}
                    >
                      <Text style={[styles.inviteText, invited && styles.inviteTextOn]}>
                        {invited ? 'Inbjuden ✓' : '+ Bjud in'}
                      </Text>
                    </Pressable>
                  </View>
                )
              })
            )}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, backgroundColor: '#F1EFE8' },
  clubName: { fontSize: 13, color: '#0F6E56', fontWeight: '600', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 6 },
  privateTag: { fontSize: 12, color: '#854F0B', fontWeight: '600', marginBottom: 6 },
  date: { fontSize: 15, color: '#333', marginBottom: 4 },
  location: { fontSize: 14, color: '#555' },
  body: { padding: 20 },
  description: { fontSize: 16, lineHeight: 24, color: '#333', marginBottom: 20 },
  btn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnOn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#0F6E56' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  btnTextOn: { color: '#0F6E56' },
  inviteSection: { marginTop: 28 },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginBottom: 10 },
  empty: { color: '#888', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10, borderBottomWidth: 1, borderBottomColor: '#f3f3f3' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1EFE8' },
  ph: { justifyContent: 'center', alignItems: 'center' },
  letter: { fontSize: 16, color: '#0F6E56', fontWeight: '600' },
  name: { flex: 1, fontSize: 15, color: '#222' },
  inviteBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6, backgroundColor: '#0F6E56' },
  inviteBtnOn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#0F6E56' },
  inviteText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  inviteTextOn: { color: '#0F6E56' },
})

import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { getClubById, isFollowing, followClub, unfollowClub } from '../../lib/data'
import { Club } from '../../lib/types'

export default function ClubProfile() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    getClubById(id).then(setClub).finally(() => setLoading(false))
    isFollowing(id).then(setFollowing)
  }, [id])

  async function toggleFollow() {
    if (!id || followBusy) return
    setFollowBusy(true)
    try {
      if (following) {
        await unfollowClub(id)
        setFollowing(false)
      } else {
        await followClub(id)
        setFollowing(true)
      }
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte uppdatera följ-status')
    } finally {
      setFollowBusy(false)
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />
  if (!club) return <Text style={{ padding: 20 }}>Förening hittades inte</Text>

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: club.name, headerBackTitle: 'Tillbaka' }} />
      <View style={styles.header}>
        <Text style={styles.name}>{club.name}</Text>
        <Text style={styles.meta}>{club.city} · {club.sports.join(', ')}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.description}>{club.description}</Text>
        <Pressable
          style={[styles.followBtn, following && styles.followingBtn]}
          onPress={toggleFollow}
          disabled={followBusy}
        >
          <Text style={[styles.followText, following && styles.followingText]}>
            {followBusy ? '…' : following ? 'Följer ✓' : 'Följ förening'}
          </Text>
        </Pressable>
        {club.website && <Text style={styles.link}>🌐 {club.website}</Text>}
        {club.contact_email && <Text style={styles.link}>✉️ {club.contact_email}</Text>}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, backgroundColor: '#F1EFE8' },
  name: { fontSize: 24, fontWeight: '600', marginBottom: 6 },
  meta: { fontSize: 14, color: '#666' },
  body: { padding: 20 },
  description: { fontSize: 16, lineHeight: 24, color: '#333', marginBottom: 20 },
  followBtn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  followingBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#0F6E56' },
  followText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  followingText: { color: '#0F6E56' },
  link: { fontSize: 14, color: '#555', marginBottom: 6 },
})

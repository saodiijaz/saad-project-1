import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Share } from 'react-native'
import { useLocalSearchParams, Stack, useRouter } from 'expo-router'
import {
  getClubById, isFollowing, followClub, unfollowClub,
  getClubPosts, isClubAdmin, getClubFollowerCount,
  getClubStats, ClubStats,
} from '../../lib/data'
import { Club, ClubPost } from '../../lib/types'
import { hapticLight, hapticError } from '../../lib/haptics'

export default function ClubProfile() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)
  const [posts, setPosts] = useState<ClubPost[]>([])
  const [admin, setAdmin] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [stats, setStats] = useState<ClubStats | null>(null)

  useEffect(() => {
    if (!id) return
    getClubById(id).then(setClub).finally(() => setLoading(false))
    isFollowing(id).then(setFollowing)
    getClubPosts(id).then(setPosts)
    isClubAdmin(id).then(isA => {
      setAdmin(isA)
      if (isA) getClubStats(id).then(setStats).catch(() => {})
    })
    getClubFollowerCount(id).then(setFollowerCount)
  }, [id])

  async function shareClub() {
    if (!club || !id) return
    const deepLink = `sportmeet://club/${id}`
    const webFallback = `https://sportmeet.app/club/${id}` // placeholder-domän
    try {
      await Share.share({
        message: `Kolla in ${club.name} på SportMeet!\n\n${deepLink}\n\n(Webb: ${webFallback})`,
        title: club.name,
      })
    } catch {
      // User cancelled or failed — silent
    }
  }

  async function toggleFollow() {
    if (!id || followBusy) return
    setFollowBusy(true)
    try {
      if (following) { await unfollowClub(id); setFollowing(false) }
      else { await followClub(id); setFollowing(true) }
      hapticLight()
    } catch (e: any) {
      hapticError()
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

        <Pressable style={styles.shareBtn} onPress={shareClub}>
          <Text style={styles.shareBtnText}>📤 Dela</Text>
        </Pressable>

        {admin && stats && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.followers}</Text>
              <Text style={styles.statLabel}>Följare</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.posts}</Text>
              <Text style={styles.statLabel}>Inlägg</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.likes}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.comments}</Text>
              <Text style={styles.statLabel}>Kommentarer</Text>
            </View>
          </View>
        )}

        {admin && (
          <Pressable style={styles.adminBtn} onPress={() => router.push(`/club/${id}/new-post`)}>
            <Text style={styles.adminBtnText}>+ Skapa post</Text>
          </Pressable>
        )}

        {admin && (
          <Pressable style={styles.adminBtn} onPress={() => router.push(`/club/${id}/edit`)}>
            <Text style={styles.adminBtnText}>✎ Redigera förening</Text>
          </Pressable>
        )}

        {admin && (
          <Pressable style={styles.adminBtn} onPress={() => router.push(`/club/${id}/followers`)}>
            <Text style={styles.adminBtnText}>👥 {followerCount} följare</Text>
          </Pressable>
        )}

        {club.website && <Text style={styles.link}>🌐 {club.website}</Text>}
        {club.contact_email && <Text style={styles.link}>✉️ {club.contact_email}</Text>}

        {posts.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Händelser</Text>
            {posts.map(p => (
              <View key={p.id} style={styles.postCard}>
                <Text style={styles.postTitle}>{p.title}</Text>
                {p.event_at && (
                  <Text style={styles.postDate}>
                    {new Date(p.event_at).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {p.location && ` · ${p.location}`}
                  </Text>
                )}
                <Text style={styles.postBody}>{p.body}</Text>
              </View>
            ))}
          </View>
        )}
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
  adminBtn: { backgroundColor: '#F1EFE8', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#0F6E56' },
  adminBtnText: { color: '#0F6E56', fontSize: 15, fontWeight: '500' },
  shareBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  shareBtnText: { fontSize: 15, color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#222' },
  postCard: { padding: 14, backgroundColor: '#fafafa', borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  postTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  postDate: { fontSize: 13, color: '#0F6E56', marginBottom: 6 },
  postBody: { fontSize: 14, color: '#333', lineHeight: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statCard: { flexGrow: 1, flexBasis: '47%', padding: 12, borderRadius: 10, backgroundColor: '#F1EFE8', alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#0F6E56' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
})

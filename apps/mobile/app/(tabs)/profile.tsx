import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase, hasSupabaseConfig } from '../../lib/supabase'
import { signOut } from '../../lib/auth'
import { getMyProfile, UserProfile } from '../../lib/data'
import { getMyBadges, Badge } from '../../lib/badges'
import type { User } from '@supabase/supabase-js'

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false)
      return
    }
    const [{ data }, p, b] = await Promise.all([
      supabase.auth.getUser(),
      getMyProfile(),
      getMyBadges().catch(() => [] as Badge[]),
    ])
    setUser(data.user)
    setProfile(p)
    setBadges(b)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useFocusEffect(useCallback(() => { load() }, [load]))

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />

  if (!hasSupabaseConfig) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.subtitle}>Demo-läge — ingen inloggning tillgänglig</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      {profile?.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>
            {(profile?.display_name ?? user?.email ?? '?').slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}
      {user && (
        <>
          {profile?.display_name ? (
            <Text style={styles.name}>{profile.display_name}</Text>
          ) : null}
          <Text style={styles.email}>{user.email}</Text>
          {profile?.city ? <Text style={styles.city}>📍 {profile.city}</Text> : null}
          <Text style={styles.meta}>Inloggad sedan {new Date(user.created_at).toLocaleDateString('sv-SE')}</Text>
        </>
      )}
      {badges.length > 0 && (
        <View style={styles.badgesRow}>
          {badges.map(b => (
            <View key={b.id} style={[styles.badge, !b.earned && styles.badgeLocked]}>
              <Text style={[styles.badgeEmoji, !b.earned && styles.badgeEmojiLocked]}>{b.emoji}</Text>
              <Text style={[styles.badgeLabel, !b.earned && styles.badgeLabelLocked]}>{b.label}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
        <Text style={styles.editBtnText}>Redigera profil</Text>
      </Pressable>
      <Pressable style={styles.friendsBtn} onPress={() => router.push('/friends')}>
        <Text style={styles.friendsBtnText}>Mina vänner</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>Logga ut</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 24 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 16, backgroundColor: '#F1EFE8' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 36, color: '#0F6E56', fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '500', marginBottom: 4 },
  email: { fontSize: 16, color: '#444', marginBottom: 6 },
  city: { fontSize: 14, color: '#555', marginBottom: 8 },
  meta: { fontSize: 13, color: '#666', marginBottom: 24 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 8 },
  editBtn: {
    backgroundColor: '#0F6E56', padding: 14, borderRadius: 8,
    paddingHorizontal: 32, marginBottom: 12,
  },
  editBtnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  friendsBtn: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#0F6E56',
    padding: 14, borderRadius: 8, paddingHorizontal: 32, marginBottom: 12,
  },
  friendsBtnText: { color: '#0F6E56', fontSize: 16, fontWeight: '500' },
  button: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E24B4A',
    padding: 14, borderRadius: 8, paddingHorizontal: 32,
  },
  buttonText: { color: '#E24B4A', fontSize: 16, fontWeight: '500' },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 16, maxWidth: 320 },
  badge: { width: 88, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F1EFE8', alignItems: 'center' },
  badgeLocked: { backgroundColor: '#F5F5F5' },
  badgeEmoji: { fontSize: 24 },
  badgeEmojiLocked: { opacity: 0.3 },
  badgeLabel: { fontSize: 11, color: '#0F6E56', fontWeight: '600', marginTop: 2 },
  badgeLabelLocked: { color: '#bbb', fontWeight: '500' },
})

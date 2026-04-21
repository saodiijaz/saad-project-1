import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase, hasSupabaseConfig } from '../../lib/supabase'
import { signOut } from '../../lib/auth'
import { getMyProfile, UserProfile } from '../../lib/data'
import type { User } from '@supabase/supabase-js'

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false)
      return
    }
    const [{ data }, p] = await Promise.all([
      supabase.auth.getUser(),
      getMyProfile(),
    ])
    setUser(data.user)
    setProfile(p)
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
      <Pressable style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
        <Text style={styles.editBtnText}>Redigera profil</Text>
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
  button: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E24B4A',
    padding: 14, borderRadius: 8, paddingHorizontal: 32,
  },
  buttonText: { color: '#E24B4A', fontSize: 16, fontWeight: '500' },
})

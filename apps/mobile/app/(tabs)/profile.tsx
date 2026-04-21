import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { supabase, hasSupabaseConfig } from '../../lib/supabase'
import { signOut } from '../../lib/auth'
import type { User } from '@supabase/supabase-js'

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
  }, [])

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
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.meta}>Inloggad sedan {new Date(user.created_at).toLocaleDateString('sv-SE')}</Text>
        </>
      )}
      <Pressable style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>Logga ut</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 24 },
  email: { fontSize: 18, marginBottom: 8 },
  meta: { fontSize: 13, color: '#666', marginBottom: 40 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 8 },
  button: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E24B4A',
    padding: 14, borderRadius: 8, paddingHorizontal: 32,
  },
  buttonText: { color: '#E24B4A', fontSize: 16, fontWeight: '500' },
})

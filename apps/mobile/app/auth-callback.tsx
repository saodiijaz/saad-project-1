import { useEffect } from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // Supabase SDK handles the session automatically via URL
    // Give it a moment, then route to the app
    const timer = setTimeout(async () => {
      if (!supabase) return router.replace('/login')
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/(tabs)')
      } else {
        router.replace('/login')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator />
      <Text style={{ marginTop: 12, color: '#666' }}>Loggar in...</Text>
    </View>
  )
}

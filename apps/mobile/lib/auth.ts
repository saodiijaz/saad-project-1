import { supabase } from './supabase'
import * as Linking from 'expo-linking'

export async function signInWithEmail(email: string) {
  if (!supabase) throw new Error('Supabase not configured')

  const redirectTo = Linking.createURL('/auth-callback')

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  })

  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

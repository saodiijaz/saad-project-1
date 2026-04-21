import { useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { signInWithEmail } from '../lib/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!email || !email.includes('@')) {
      setError('Ange en giltig e-postadress')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await signInWithEmail(email.trim().toLowerCase())
      setSent(true)
    } catch (err: any) {
      setError(err.message ?? 'Något gick fel')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Kolla mailen</Text>
        <Text style={styles.subtitle}>
          Vi skickade en länk till {email}. Klicka på länken för att logga in.
        </Text>
        <Pressable onPress={() => { setSent(false); setEmail('') }}>
          <Text style={styles.link}>Använd annan e-post</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>SportMeet</Text>
      <Text style={styles.subtitle}>Logga in med din e-post</Text>
      <TextInput
        placeholder="din@email.se"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        style={styles.input}
        editable={!loading}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Skicka länk</Text>
        )}
      </Pressable>
      <Text style={styles.hint}>Vi skickar en klickbar länk till din e-post.</Text>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center',
  },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 14, fontSize: 16, marginBottom: 12,
  },
  button: {
    backgroundColor: '#0F6E56', padding: 16, borderRadius: 8,
    alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  error: { color: '#E24B4A', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  hint: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 24 },
  link: { fontSize: 14, color: '#0F6E56', marginTop: 20, textAlign: 'center' },
})

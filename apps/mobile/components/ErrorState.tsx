import { View, Text, Pressable, StyleSheet } from 'react-native'

type Props = {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Något gick fel', message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.retry} onPress={onRetry}>
          <Text style={styles.retryText}>Försök igen</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 14, color: '#666', lineHeight: 20, textAlign: 'center', marginBottom: 20, maxWidth: 280 },
  retry: { backgroundColor: '#0F6E56', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 15, fontWeight: '500' },
})

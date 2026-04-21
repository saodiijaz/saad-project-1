import { View, Text, StyleSheet } from 'react-native'

export default function Feed() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flöde</Text>
      <Text style={styles.subtitle}>Kommer i nästa brief</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '500', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888' },
})

import { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import NetInfo from '@react-native-community/netinfo'

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      setOffline(!state.isConnected)
    })
    return () => unsub()
  }, [])

  if (!offline) return null

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>📡 Ingen internetanslutning</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#d33', padding: 8, alignItems: 'center' },
  text: { color: '#fff', fontSize: 13, fontWeight: '500' },
})

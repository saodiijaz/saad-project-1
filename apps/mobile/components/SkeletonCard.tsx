import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'

export function SkeletonCard() {
  const fade = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fade, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [fade])

  return (
    <Animated.View style={[styles.card, { opacity: fade }]}>
      <View style={[styles.line, { width: '60%' }]} />
      <View style={[styles.line, { width: '40%', marginTop: 8 }]} />
      <View style={[styles.lineSm, { width: '90%', marginTop: 12 }]} />
      <View style={[styles.lineSm, { width: '80%', marginTop: 6 }]} />
    </Animated.View>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  line: { height: 16, backgroundColor: '#ddd', borderRadius: 4 },
  lineSm: { height: 12, backgroundColor: '#e5e5e5', borderRadius: 4 },
})

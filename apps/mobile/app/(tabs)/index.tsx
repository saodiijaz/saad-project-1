import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, Pressable, TextInput, ScrollView, RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { getClubs, getCities, City } from '../../lib/data'
import { Club } from '../../lib/types'
import { hasSupabaseConfig } from '../../lib/supabase'
import { SkeletonList } from '../../components/SkeletonCard'
import { ErrorState } from '../../components/ErrorState'
import { PressableScale } from '../../components/PressableScale'

const SPORT_COLORS: Record<string, { bg: string; fg: string }> = {
  hockey: { bg: '#E8F0FE', fg: '#1A73E8' },
  football: { bg: '#E6F4EA', fg: '#137333' },
  golf: { bg: '#FEF7E0', fg: '#B06000' },
  basketball: { bg: '#FCE8E6', fg: '#D93025' },
  triathlon: { bg: '#F3E8FD', fg: '#8430CE' },
}
const DEFAULT_BADGE = { bg: '#EEE', fg: '#444' }

const QUICK_SPORTS = [
  { key: 'all', label: 'Alla' },
  { key: 'hockey', label: 'Hockey' },
  { key: 'football', label: 'Fotboll' },
  { key: 'golf', label: 'Golf' },
  { key: 'basketball', label: 'Basket' },
  { key: 'triathlon', label: 'Triathlon' },
]

export default function Discover() {
  const router = useRouter()
  const [clubs, setClubs] = useState<Club[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sport, setSport] = useState<string>('all')
  const [cityName, setCityName] = useState<string>('all') // 'all' or city name
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  function load() {
    setError(null)
    setLoading(true)
    Promise.all([getClubs(), getCities()])
      .then(([cl, ci]) => { setClubs(cl); setCities(ci) })
      .catch(err => setError(err?.message ?? 'Kunde inte ladda föreningar'))
      .finally(() => setLoading(false))
  }

  async function onRefresh() {
    setRefreshing(true)
    try {
      const [cl, ci] = await Promise.all([getClubs(), getCities()])
      setClubs(cl); setCities(ci)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = clubs.filter(c => {
    const matchesQuery =
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.sports.some(s => s.toLowerCase().includes(query.toLowerCase()))
    const matchesSport = sport === 'all' || c.sports.includes(sport)
    const matchesCity = cityName === 'all' || c.city === cityName
    return matchesQuery && matchesSport && matchesCity
  })

  if (error) return <ErrorState message={error} onRetry={load} />
  if (loading) return <SkeletonList count={5} />

  return (
    <View style={styles.container}>
      {!hasSupabaseConfig && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Demo-läge: visar mock-data</Text>
        </View>
      )}
      <TextInput
        placeholder="Sök förening eller sport…"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

      <Text style={styles.filterLabel}>Stad</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Pressable style={[styles.chip, cityName === 'all' && styles.chipActive]} onPress={() => setCityName('all')}>
          <Text style={[styles.chipText, cityName === 'all' && styles.chipTextActive]}>Alla städer</Text>
        </Pressable>
        {cities.map(c => (
          <Pressable
            key={c.id}
            style={[styles.chip, cityName === c.name && styles.chipActive]}
            onPress={() => setCityName(c.name)}
          >
            <Text style={[styles.chipText, cityName === c.name && styles.chipTextActive]}>{c.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.filterLabel}>Sport</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {QUICK_SPORTS.map(s => (
          <Pressable key={s.key} style={[styles.chip, sport === s.key && styles.chipActive]} onPress={() => setSport(s.key)}>
            <Text style={[styles.chipText, sport === s.key && styles.chipTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PressableScale style={styles.card} onPress={() => router.push(`/club/${item.id}`)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.city}>{item.city}</Text>
            <View style={styles.badgeRow}>
              {item.sports.map(s => {
                const c = SPORT_COLORS[s] ?? DEFAULT_BADGE
                return (
                  <View key={s} style={[styles.badge, { backgroundColor: c.bg }]}>
                    <Text style={[styles.badgeText, { color: c.fg }]}>{s}</Text>
                  </View>
                )
              })}
            </View>
            <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
          </PressableScale>
        )}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={<Text style={styles.empty}>Inga föreningar matchade filtret</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F6E56']} tintColor="#0F6E56" />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  banner: { backgroundColor: '#FAEEDA', padding: 8 },
  bannerText: { textAlign: 'center', color: '#854F0B', fontSize: 12 },
  search: { margin: 16, marginBottom: 8, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, fontSize: 16 },
  filterLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', marginLeft: 16, marginTop: 8, marginBottom: 4, letterSpacing: 0.5 },
  chipRow: { paddingHorizontal: 16, paddingBottom: 4, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1EFE8', marginRight: 8 },
  chipActive: { backgroundColor: '#0F6E56' },
  chipText: { fontSize: 14, color: '#444' },
  chipTextActive: { color: '#fff', fontWeight: '500' },
  card: { padding: 16, borderWidth: 1, borderColor: '#eee', borderRadius: 12, backgroundColor: '#fafafa' },
  name: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  city: { fontSize: 13, color: '#666', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginRight: 6 },
  badgeText: { fontSize: 11, fontWeight: '500', textTransform: 'capitalize' },
  desc: { fontSize: 14, color: '#333', lineHeight: 20 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
})

# BRIEF-UI-019: Felhantering och offline-banner

## Mål
Visa vänliga felmeddelanden när något går fel (nätverk dör, Supabase down, etc.) istället för att appen bara fryser eller kraschar.

## Blockerad av
Inget.

## Berörda filer
- `apps/mobile/components/ErrorState.tsx` — ny komponent
- `apps/mobile/components/OfflineBanner.tsx` — ny komponent
- `apps/mobile/app/_layout.tsx` — visa OfflineBanner global
- Befintliga skärmar — wrap data-fetching med try/catch och visa ErrorState

## Steg

### 1. Installera NetInfo (för att upptäcka offline):
```bash
cd apps/mobile
npx expo install @react-native-community/netinfo
```

### 2. Skapa `apps/mobile/components/ErrorState.tsx`:
```tsx
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
```

### 3. Skapa `apps/mobile/components/OfflineBanner.tsx`:
```tsx
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
```

### 4. Lägg in OfflineBanner i `apps/mobile/app/_layout.tsx`:
```tsx
import { OfflineBanner } from '../components/OfflineBanner'
// ... i render-funktionen, högst upp:
return (
  <>
    <OfflineBanner />
    {/* existing layout */}
  </>
)
```

### 5. Använd ErrorState i data-fetching (exempel för Discover-skärmen):
I `apps/mobile/app/(tabs)/index.tsx`, lägg till state för error:
```tsx
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  getClubs()
    .then(setClubs)
    .catch(err => setError(err?.message ?? 'Kunde inte ladda föreningar'))
    .finally(() => setLoading(false))
}, [])

// I render:
if (error) return <ErrorState message={error} onRetry={() => {
  setError(null); setLoading(true);
  getClubs().then(setClubs).catch(e => setError(e?.message ?? 'Fel')).finally(() => setLoading(false))
}} />
```

Gör liknande för feed, events, friends.

## Verifiering
- [ ] `pnpm install` klart (ny dep: @react-native-community/netinfo)
- [ ] Slå av wifi → röd banner "Ingen internetanslutning" syns
- [ ] Slå på igen → banner försvinner
- [ ] Simulera fel (t.ex. ändra Supabase-url till något ogiltigt i .env) → ErrorState visas

## Anti-patterns
- Visa INTE tekniska felmeddelanden till user (t.ex. "ECONNREFUSED 127.0.0.1") — generisk text "Kunde inte ladda" är bättre
- Wrap INTE ALLA try/catch runt varje call — det blir överdrivet. Bara på toppnivån i skärmar.

## Commit
`BRIEF-UI-019: Error handling and offline banner`

## Rollback
Git checkout + ta bort nya komponenter + uninstall NetInfo

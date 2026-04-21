# BRIEF-UI-017: Tomma-state illustrationer

## Mål
Gör tomma vyer trevligare: när Events-fliken är tom / Flödet är tomt / Sök-resultat är tomt, visa en vänlig illustration + text istället för bara "Inga events".

## Kontext
Idag visar appen bara "Inga kommande events" eller "Laddar…" som text. Det ser livlöst ut. En enkel illustration + tydligt call-to-action gör appen mycket mer polerad.

## Blockerad av
Inget. Använder bara emojis och befintliga komponenter.

## Berörda filer
- `apps/mobile/components/EmptyState.tsx` — ny komponent
- `apps/mobile/app/(tabs)/events.tsx` — använd EmptyState
- `apps/mobile/app/(tabs)/feed.tsx` — använd EmptyState
- `apps/mobile/app/friends.tsx` — använd EmptyState för tomma tabs

## Steg

### 1. Skapa `apps/mobile/components/EmptyState.tsx`:
```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native'

type Props = {
  emoji?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ emoji = '📭', title, description, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Pressable style={styles.action} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 280,
  },
  action: {
    backgroundColor: '#0F6E56',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
})
```

### 2. Uppdatera `apps/mobile/app/(tabs)/events.tsx`:
Ersätt raden `ListEmptyComponent={<Text style={styles.empty}>...</Text>}` med:
```tsx
ListEmptyComponent={
  <EmptyState
    emoji="📅"
    title="Inga kommande events"
    description="Det finns inga events just nu. Skapa det första!"
    actionLabel="+ Skapa event"
    onAction={() => router.push('/event/new')}
  />
}
```
Importera: `import { EmptyState } from '../../components/EmptyState'`

### 3. Uppdatera `apps/mobile/app/(tabs)/feed.tsx`:
Ersätt tomma-state med:
```tsx
<EmptyState
  emoji="📣"
  title="Inget i flödet ännu"
  description="Följ föreningar i Upptäck eller lägg till vänner för att fylla flödet."
/>
```

### 4. Uppdatera `apps/mobile/app/friends.tsx`:
I Vänner-tabben:
```tsx
<EmptyState
  emoji="🤝"
  title="Inga vänner än"
  description="Sök upp någon i Sök-tabben för att skicka din första vänförfrågan."
/>
```

I Förfrågningar-tabben:
```tsx
<EmptyState
  emoji="✉️"
  title="Inga förfrågningar"
  description="När någon skickar dig en vänförfrågan dyker den upp här."
/>
```

## Verifiering
- [ ] Alla 4 tomma-states renderar EmptyState istället för plain text
- [ ] Emoji + title + beskrivning visas centrerat
- [ ] "+ Skapa event"-knappen i Events-tomma-state fungerar

## Anti-patterns
- Importera INTE EmptyState från react-native-paper eller annat UI-bibliotek — vi skriver egen
- Använd INTE bilder/SVG — emoji funkar bra och kräver inga assets

## Commit
`BRIEF-UI-017: Empty state component and usage`

## Rollback
Git checkout de 3 skärmarna + ta bort EmptyState.tsx

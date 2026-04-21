# BRIEF-UI-020: Tryck-animationer på knappar

## Mål
Alla Pressable-knappar ska ge feedback vid tryck — liten skala + opacity-change. Gör appen mer "taktil" och modern.

## Blockerad av
Inget. Använder bara Animated API från React Native (ingen ny dep).

## Berörda filer
- `apps/mobile/components/PressableScale.tsx` — ny wrapper-komponent

## Steg

### 1. Skapa `apps/mobile/components/PressableScale.tsx`:
```tsx
import { useRef, ReactNode } from 'react'
import { Animated, Pressable, PressableProps, View } from 'react-native'

type Props = PressableProps & {
  children: ReactNode
  scaleTo?: number
  style?: any
}

export function PressableScale({ children, scaleTo = 0.96, style, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current

  function handlePressIn(e: any) {
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 50, bounciness: 0 }).start()
    onPressIn?.(e)
  }

  function handlePressOut(e: any) {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()
    onPressOut?.(e)
  }

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  )
}
```

### 2. Använd i minst 3 ställen där det gör mest skillnad:

**I `apps/mobile/app/(tabs)/index.tsx`** — byt `<Pressable style={styles.card}>` mot `<PressableScale style={styles.card}>` för klubb-korten.

**I `apps/mobile/app/(tabs)/events.tsx`** — samma för event-korten.

**I `apps/mobile/app/(tabs)/feed.tsx`** — samma för feed-korten.

**I `apps/mobile/app/club/[id].tsx`** — för follow-knappen och share-knappen.

Import: `import { PressableScale } from '../../components/PressableScale'`

## Verifiering
- [ ] Tryck på ett klubb-kort → det krymper lite
- [ ] Släpp → det studsar tillbaka
- [ ] Effekten är subtil, inte störande

## Anti-patterns
- Använd INTE `useNativeDriver: false` — laggar
- Sätt INTE bounciness för högt — knapparna studsar som trampoliner
- Rör INTE alla knappar — bara stora tap-targets (kort, primära knappar)

## Commit
`BRIEF-UI-020: Press scale animation for key buttons`

## Rollback
Git checkout berörda skärmar + ta bort PressableScale.tsx

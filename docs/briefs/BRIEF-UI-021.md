# BRIEF-UI-021: Haptic feedback vid viktiga aktioner

## Mål
Telefonen vibrerar lätt när user gör något betydande (följer klubb, likes post, postar kommentar, skickar vänförfrågan). Gör appen känns responsiv och "premium".

## Blockerad av
Inget. Kräver `expo-haptics` (ingår redan i Expo managed workflow).

## Berörda filer
- `apps/mobile/lib/haptics.ts` — ny helper
- Befintliga skärmar — kalla helpern vid viktiga aktioner

## Steg

### 1. Installera expo-haptics:
```bash
cd apps/mobile
npx expo install expo-haptics
```

### 2. Skapa `apps/mobile/lib/haptics.ts`:
```typescript
import * as Haptics from 'expo-haptics'

/**
 * Light tap feedback — for toggles like follow/like
 */
export function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
    // silently fail on unsupported devices
  })
}

/**
 * Medium feedback — for more meaningful actions like sending a message
 */
export function hapticMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
}

/**
 * Success feedback — for completed actions (event created, profile saved)
 */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
}

/**
 * Error feedback — for failures
 */
export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
}
```

### 3. Använd i kodbasen:

**`apps/mobile/app/club/[id].tsx`** — i toggleFollow-funktionen, efter success:
```tsx
import { hapticLight } from '../../lib/haptics'

// i toggleFollow, efter setFollowing:
hapticLight()
```

**`apps/mobile/app/(tabs)/feed.tsx`** — i PostActions.doLike, vid like:
```tsx
import { hapticLight } from '../../lib/haptics'

// i doLike, när user likar:
if (!was) hapticLight()
```

**`apps/mobile/app/post/[type]/[id].tsx`** — när kommentar skickas:
```tsx
import { hapticMedium } from '../../../lib/haptics'

// i submit, efter success:
hapticMedium()
```

**`apps/mobile/app/event/new.tsx`** — när event skapas framgångsrikt:
```tsx
import { hapticSuccess } from '../../lib/haptics'

// efter createEvent lyckas:
hapticSuccess()
```

**`apps/mobile/app/friends.tsx`** — vid sendFriendRequest:
```tsx
import { hapticLight } from '../lib/haptics'

// i handleSendRequest efter success:
hapticLight()
```

**Alla Alert.alert med fel** — lägg till hapticError() före:
```tsx
catch (e: any) {
  hapticError()
  Alert.alert('Fel', e?.message ?? 'Något gick fel')
}
```

## Verifiering
- [ ] `pnpm install` klart
- [ ] Fungerar på iOS (haptics är bäst där)
- [ ] Fungerar på Android (lite svagare men syns)
- [ ] Failar tyst på emulatorer/web

## Anti-patterns
- Kalla INTE haptics på varje scroll eller tap — bara på betydande aktioner
- Använd INTE Vibration API — expo-haptics är bättre (stödjer iOS Taptic Engine)
- Catch alltid errors — haptics är optional, ska inte crasha appen

## Commit
`BRIEF-UI-021: Haptic feedback for key interactions`

## Rollback
Git checkout + ta bort lib/haptics.ts + uninstall expo-haptics

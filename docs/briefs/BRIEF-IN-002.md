# BRIEF-IN-002: Deep linking — dela föreningslänk

## Mål
User kan trycka "Dela"-knapp på en föreningsprofil och skicka en länk via SMS/WhatsApp/etc. Länken öppnar appen direkt på den klubben (eller fallback till webb om appen inte är installerad).

## Kontext
- App scheme `sportmeet://` är redan konfigurerad
- Expo Router stödjer deep links automatiskt — `/club/[id]` funkar som `sportmeet://club/xyz`
- Universal links (webb-fallback) kräver custom domain + assetlinks.json (senare brief, IN-013)
- MVP: bara share via custom scheme + webb-URL som fallback

## Berörda filer
- `apps/mobile/app/club/[id].tsx` — lägg till share-knapp
- (ingen ny dep — använd React Native `Share`)

## Steg

### 1. I `apps/mobile/app/club/[id].tsx`, importera Share och lägg till en knapp:

```tsx
import { Share } from 'react-native'

// Helper inom komponenten:
async function shareClub() {
  if (!club || !id) return
  const deepLink = `sportmeet://club/${id}`
  const webFallback = `https://sportmeet.app/club/${id}` // placeholder-domän
  try {
    await Share.share({
      message: `Kolla in ${club.name} på SportMeet!\n\n${deepLink}\n\n(Webb: ${webFallback})`,
      title: club.name,
    })
  } catch (e) {
    // User cancelled or failed — silent
  }
}
```

Lägg till knapp bredvid följ-knappen:
```tsx
<Pressable style={styles.shareBtn} onPress={shareClub}>
  <Text style={styles.shareBtnText}>📤 Dela</Text>
</Pressable>
```

Styles:
```tsx
shareBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
shareBtnText: { fontSize: 15, color: '#333' },
```

### 2. Verifiera att Expo Router auto-handlar deep link till `/club/[id]`

Testa genom att skriva i terminal:
```bash
# Android
adb shell am start -a android.intent.action.VIEW -d "sportmeet://club/SOME_UUID"
```

Om den öppnar rätt klubb — klart.

## Verifiering
- [ ] `pnpm typecheck` grönt
- [ ] Share-knapp visas på klubbsidan
- [ ] Delad länk har formatet `sportmeet://club/XYZ`
- [ ] Klick på länk från sms/whatsapp öppnar rätt klubbsida (manuellt test på enhet)

## Anti-patterns
- Använd INTE expo-linking för att konstruera URL — Expo Router gör detta automatiskt
- För nu: inget webb-fallback — den biten kommer i IN-013 (custom domain)
- Om webFallback-URLen inte fungerar idag, skriv ändå en placeholder så meddelandet ser bra ut

## Commit
`BRIEF-IN-002: Deep linking share button`

## Rollback
Git checkout club/[id].tsx

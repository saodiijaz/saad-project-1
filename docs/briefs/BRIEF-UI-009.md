# BRIEF-UI-009: Profil — avatar upload

## Mål
User kan ladda upp en profilbild från kameran eller galleriet. Bilden sparas i Supabase Storage och `avatar_url` uppdateras på user.

## Kontext
- Bygger på BRIEF-UI-008 (edit-profile finns)
- Supabase Storage bucket behöver skapas: `avatars` (public read, authenticated write)
- Zivar måste skapa bucket manuellt i Supabase dashboard (instruktioner nedan)

## Förutsättningar
Zivar kör manuellt i Supabase dashboard → Storage → New bucket:
- Name: `avatars`
- Public: Yes
- File size limit: 5 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

RLS-policy för bucket (SQL Editor):
```sql
-- Users kan ladda upp sin egen avatar
create policy "Users can upload own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Anyone can read avatars"
  on storage.objects for select to public
  using (bucket_id = 'avatars');
```

## Berörda filer
- `apps/mobile/lib/data.ts` — `uploadAvatar` helper
- `apps/mobile/app/edit-profile.tsx` — lägg till bild-val + uppladdning
- `apps/mobile/app/(tabs)/profile.tsx` — visa avatar
- `apps/mobile/package.json` — ny dependency: `expo-image-picker`

## Steg

### 1. Installera expo-image-picker
```bash
cd apps/mobile
npx expo install expo-image-picker
```

### 2. Lägg till i `apps/mobile/lib/data.ts`:
```typescript
export async function uploadAvatar(uri: string): Promise<string> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')

  const response = await fetch(uri)
  const blob = await response.blob()
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${session.user.id}/avatar.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { upsert: true, contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` })
  if (uploadErr) throw uploadErr

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const publicUrl = `${data.publicUrl}?t=${Date.now()}` // cache-bust

  const { error: updErr } = await supabase
    .from('users').update({ avatar_url: publicUrl }).eq('id', session.user.id)
  if (updErr) throw updErr

  return publicUrl
}
```

### 3. Uppdatera `apps/mobile/app/edit-profile.tsx` — lägg till bild-val + uppladdning:
```tsx
import { useState, useEffect } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView, Image } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { getMyProfile, updateMyProfile, uploadAvatar } from '../lib/data'

export default function EditProfile() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyProfile().then(p => {
      if (p) {
        setDisplayName(p.display_name ?? '')
        setCity(p.city ?? '')
        setAvatarUrl(p.avatar_url ?? null)
      }
    }).finally(() => setLoading(false))
  }, [])

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Tillåt galleri-åtkomst för att ändra profilbild'); return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    })
    if (result.canceled) return
    setUploadingAvatar(true)
    try {
      const url = await uploadAvatar(result.assets[0].uri)
      setAvatarUrl(url)
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte ladda upp bild')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function save() {
    setBusy(true)
    try {
      await updateMyProfile({
        display_name: displayName.trim() || undefined,
        city: city.trim() || undefined,
      })
      router.back()
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte spara')
    } finally { setBusy(false) }
  }

  if (loading) return <View style={styles.container}><Text>Laddar…</Text></View>

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Redigera profil' }} />

      <Pressable style={styles.avatarBox} onPress={pickAvatar} disabled={uploadingAvatar}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>Lägg till bild</Text>
          </View>
        )}
        {uploadingAvatar && <Text style={styles.uploadingText}>Laddar upp…</Text>}
        <Text style={styles.changeText}>{avatarUrl ? 'Byt bild' : 'Välj bild'}</Text>
      </Pressable>

      <Text style={styles.label}>Namn</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
      <Text style={styles.label}>Stad</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} />
      <Pressable style={styles.btn} onPress={save} disabled={busy}>
        <Text style={styles.btnText}>{busy ? '…' : 'Spara'}</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  avatarBox: { alignItems: 'center', marginBottom: 24, marginTop: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1EFE8' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderText: { color: '#888', fontSize: 13 },
  uploadingText: { marginTop: 8, color: '#0F6E56', fontSize: 13 },
  changeText: { marginTop: 8, color: '#0F6E56', fontSize: 14, fontWeight: '500' },
  label: { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  btn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
})
```

### 4. Uppdatera `apps/mobile/app/(tabs)/profile.tsx` — visa avatar där det är lämpligt. **Öppna filen och lägg till Image-komponent som visar `profile.avatar_url` om den finns.** (Exakt layout-ändring beror på hur profile.tsx ser ut just nu — se till att rendering inte bryter.)

## Verifiering
- [ ] `pnpm typecheck` grönt
- [ ] `expo-image-picker` är installerad (syns i package.json)
- [ ] Edit-profile har avatar-box överst
- [ ] Profile.tsx visar avatar om avatar_url finns

## Anti-patterns
- Använd INTE `fetch(uri).then(r => r.arrayBuffer())` i React Native — använd blob() istället
- Glöm INTE cache-busting i publicUrl (`?t=timestamp`) — annars visas gammal bild
- Upload path MÅSTE börja med `user_id/` för att RLS ska tillåta

## Commit
`BRIEF-UI-009: Profile avatar upload`

## Rollback
```bash
git checkout apps/mobile/lib/data.ts
git checkout apps/mobile/app/edit-profile.tsx
git checkout apps/mobile/app/(tabs)/profile.tsx
git checkout apps/mobile/package.json
cd apps/mobile && pnpm install
```

# NIGHTLY RUN 2 — Föreningar + Events + Profiler (för Cowork)

## Arbetsflöde
- **Verktyg:** Cowork (lokalt på ZIVARPC)
- **Repo:** `C:\Users\Zivar-PC\saad-project-1`
- **Push till GitHub:** Zivar gör manuellt på morgonen efter verifiering
- **Branch-strategi:** Cowork jobbar på `claude/nightly-run-2`, alla commits där. PR till main skapas morgon.
- **Kontinuerligt flöde:** När denna lista är klar, fortsätt till `BRIEF-QUEUE.md` i docs/briefs/ och ta nästa brief.

## Cowork-instruktion (klistra in i Cowork)

```
Du jobbar kontinuerligt mot detta repo tills det inte finns fler briefs att köra.

FLÖDE:
1. Switch to (or create) branch "claude/nightly-run-2"
2. Kör briefs från NIGHTLY-RUN-2.md i ordning (BRIEF-DB-002, UI-002 → UI-008)
3. När NIGHTLY-RUN-2 är klar → öppna docs/briefs/BRIEF-QUEUE.md och ta nästa brief därifrån
4. Fortsätt tills alla briefs är körda ELLER en brief är blockerad

FÖR VARJE BRIEF:
1. Läs briefen noga
2. Implementera som specificerat
3. Kör `pnpm typecheck` lokalt för att verifiera att TypeScript är grönt
4. Commit med meddelande: "BRIEF-XXX: <short description>"
5. Gå vidare till nästa

LOOP-BEGRÄNSNING (VIKTIGT):
- Max 2 försök per brief. Om typecheck eller logik failar efter 2 försök:
  - Markera briefen som BLOCKED i STATUS.md
  - Kommentera VAD som failade (error-meddelande, rad, fil)
  - Commit det du har med prefix "WIP BRIEF-XXX: <vad som gjordes>"
  - Hoppa till nästa brief i kön
- Du ska ALDRIG försöka samma sak mer än 2 gånger i rad
- Om 3+ briefs i följd misslyckas → STOPPA helt och skriv STATUS.md

NÄR DU SKRIVER KOD:
- Följ existerande kodstil i repot (React Native, inte Expo web)
- Använd `pnpm install` om nya paket behövs — dokumentera i brief-kommentaren
- TypeScript strict — inga `any` utan kommentar
- Använd befintliga helpers i lib/ (data.ts, supabase.ts, auth.ts)

VAD DU INTE GÖR:
- Push till origin — Zivar gör det manuellt på morgonen
- Kör Supabase-migrationer — Zivar kör dem manuellt
- Ändra .env — den är gitignored
- Radera kod — flytta till staging/kommentera ut om osäker
- Hoppa över typecheck — varje brief ska typechecka grönt innan commit

NÄR ALLT ÄR KLART:
- Skriv STATUS.md i repo-root
- Lista varje brief: DONE / BLOCKED / SKIPPED
- Lämna branch redo för manuell push
- Sluta.

Starta med BRIEF-DB-002.
```

---

## DEL 1 — VAD ZIVAR GÖR FÖRE SÖMN (15 min)

### Steg A — Synka lokal kod
```powershell
cd C:\Users\Zivar-PC\saad-project-1
git checkout main
git pull origin main
cd apps\mobile
pnpm install
```

### Steg B — Kör migration 004 i Supabase SQL Editor

Gå till https://supabase.com/dashboard/project/yhlaacpvucjvnczyauze/sql/new
Kopiera innehållet från `supabase/migrations/004_auth_user_trigger.sql` och kör. Ska säga "Success".

### Steg C — Konfigurera Supabase Auth redirect URLs

https://supabase.com/dashboard/project/yhlaacpvucjvnczyauze/auth/url-configuration

- **Site URL:** `sportmeet://`
- **Redirect URLs** (lägg till via "Add URL"):
  - `sportmeet://auth-callback`
  - `exp://192.168.50.169:8081/--/auth-callback`
- Spara

### Steg D — Logga in i appen en gång

```powershell
cd C:\Users\Zivar-PC\saad-project-1\apps\mobile
npx expo start --lan --clear
```

- Skanna QR
- Login-skärmen ska komma upp direkt
- Ange din email, tryck "Skicka länk"
- Klicka mail-länken → appen öppnas, inloggad
- Verifiera att din mail syns i Profil-fliken
- Stäng terminalen (Ctrl+C)

### Steg E — Gör dig till LHC-admin

I Supabase SQL Editor:
```sql
-- Byt DIN@EMAIL.SE till din riktiga email
insert into public.club_members (club_id, user_id, role)
select c.id, u.id, 'admin'
from public.clubs c, public.users u
where c.slug = 'linkopings-hc' and u.email = 'DIN@EMAIL.SE'
on conflict (club_id, user_id) do update set role = 'admin';
```

### Steg F — Starta Cowork

Ge Cowork instruktionen från toppen av detta dokument. Gå och sov.

---

## BRIEFS (Cowork kör dessa i ordning)

---

### BRIEF-DB-002: Seed LHC posts + events schema

**Mål:** Lägg till events + event_attendees-tabeller + seed-data för LHC (3 posts, 2 events).

Skapa `supabase/migrations/006_events_schema.sql`:

```sql
-- BRIEF-DB-002: Events schema

create table public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  created_by uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  max_attendees int,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create index events_club_idx on public.events(club_id);
create index events_starts_idx on public.events(starts_at);

create policy "Anyone can read public events"
  on public.events for select
  using (is_public = true);

create policy "Authenticated users can create events"
  on public.events for insert
  with check (auth.uid() = created_by);

create policy "Creators can update own events"
  on public.events for update
  using (auth.uid() = created_by);

create policy "Creators can delete own events"
  on public.events for delete
  using (auth.uid() = created_by);

-- Event attendees
create table public.event_attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'maybe', 'declined')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.event_attendees enable row level security;

create policy "Anyone can read attendees of public events"
  on public.event_attendees for select
  using (
    exists (select 1 from public.events where id = event_attendees.event_id and is_public)
  );

create policy "Users can join events"
  on public.event_attendees for insert
  with check (auth.uid() = user_id);

create policy "Users can update own attendance"
  on public.event_attendees for update
  using (auth.uid() = user_id);

create policy "Users can leave events"
  on public.event_attendees for delete
  using (auth.uid() = user_id);
```

Skapa `supabase/migrations/007_seed_lhc_content.sql`:

```sql
-- Seed 3 posts for LHC
insert into public.club_posts (club_id, title, body, event_at, location)
select c.id, 'Hemmamatch mot Frölunda',
  'På lördag 19:00 tar vi emot Frölunda i Saab Arena. Biljetter via vår hemsida.',
  now() + interval '3 days', 'Saab Arena, Linköping'
from public.clubs c where c.slug = 'linkopings-hc'
on conflict do nothing;

insert into public.club_posts (club_id, title, body, event_at, location)
select c.id, 'Öppen träning på onsdag',
  'Nästa onsdag kl 17-18:30 har vi öppen träning. Kom och kolla in laget.',
  now() + interval '7 days', 'Saab Arena, Linköping'
from public.clubs c where c.slug = 'linkopings-hc'
on conflict do nothing;

insert into public.club_posts (club_id, title, body)
select c.id, 'Landslagsuttagning',
  'Vi gratulerar vår center som blev uttagen till Tre Kronor inför VM.'
from public.clubs c where c.slug = 'linkopings-hc'
on conflict do nothing;
```

**Commit:** `BRIEF-DB-002: Events schema + LHC content seed`

**Zivar kör dessa migrationer manuellt imorgon i SQL Editor.**

---

### BRIEF-UI-002: Follow-systemet funkar

**Mål:** Följ-knappen sparar till `follows`-tabellen, visar rätt status vid återbesök.

**Filer:**
- `apps/mobile/lib/data.ts` — lägg till follow-helpers
- `apps/mobile/app/club/[id].tsx` — använd riktig follow-state

**Steg 1 — Lägg till i slutet av `apps/mobile/lib/data.ts`:**

```typescript
export async function isFollowing(clubId: string): Promise<boolean> {
  if (!hasSupabaseConfig || !supabase) return false
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false

  const { data } = await supabase
    .from('follows')
    .select('club_id')
    .eq('user_id', session.user.id)
    .eq('club_id', clubId)
    .maybeSingle()

  return !!data
}

export async function followClub(clubId: string): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')

  const { error } = await supabase
    .from('follows')
    .insert({ user_id: session.user.id, club_id: clubId })

  if (error && error.code !== '23505') throw error
}

export async function unfollowClub(clubId: string): Promise<void> {
  if (!supabase) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  await supabase
    .from('follows')
    .delete()
    .eq('user_id', session.user.id)
    .eq('club_id', clubId)
}

export async function getFollowedClubs(): Promise<Club[]> {
  if (!hasSupabaseConfig || !supabase) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const { data, error } = await supabase
    .from('follows')
    .select(`
      clubs (
        id, name, slug, description, logo_url, cover_url,
        city, website, contact_email, created_at,
        club_sports ( sports ( slug ) )
      )
    `)
    .eq('user_id', session.user.id)

  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row.clubs,
    sports: (row.clubs.club_sports ?? []).map((cs: any) => cs.sports?.slug).filter(Boolean),
  }))
}
```

**Steg 2 — Skriv över `apps/mobile/app/club/[id].tsx`:**

```tsx
import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { getClubById, isFollowing, followClub, unfollowClub } from '../../lib/data'
import { Club } from '../../lib/types'

export default function ClubProfile() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    getClubById(id).then(setClub).finally(() => setLoading(false))
    isFollowing(id).then(setFollowing)
  }, [id])

  async function toggleFollow() {
    if (!id || followBusy) return
    setFollowBusy(true)
    try {
      if (following) {
        await unfollowClub(id)
        setFollowing(false)
      } else {
        await followClub(id)
        setFollowing(true)
      }
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte uppdatera följ-status')
    } finally {
      setFollowBusy(false)
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />
  if (!club) return <Text style={{ padding: 20 }}>Förening hittades inte</Text>

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: club.name, headerBackTitle: 'Tillbaka' }} />
      <View style={styles.header}>
        <Text style={styles.name}>{club.name}</Text>
        <Text style={styles.meta}>{club.city} · {club.sports.join(', ')}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.description}>{club.description}</Text>
        <Pressable
          style={[styles.followBtn, following && styles.followingBtn]}
          onPress={toggleFollow}
          disabled={followBusy}
        >
          <Text style={[styles.followText, following && styles.followingText]}>
            {followBusy ? '…' : following ? 'Följer ✓' : 'Följ förening'}
          </Text>
        </Pressable>
        {club.website && <Text style={styles.link}>🌐 {club.website}</Text>}
        {club.contact_email && <Text style={styles.link}>✉️ {club.contact_email}</Text>}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, backgroundColor: '#F1EFE8' },
  name: { fontSize: 24, fontWeight: '600', marginBottom: 6 },
  meta: { fontSize: 14, color: '#666' },
  body: { padding: 20 },
  description: { fontSize: 16, lineHeight: 24, color: '#333', marginBottom: 20 },
  followBtn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  followingBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#0F6E56' },
  followText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  followingText: { color: '#0F6E56' },
  link: { fontSize: 14, color: '#555', marginBottom: 6 },
})
```

**Commit:** `BRIEF-UI-002: Follow persists to database`

---

### BRIEF-UI-003: Föreningsposter visas + admin kan skapa

**Mål:** Föreningsprofilen visar club_posts. Om du är admin för den föreningen → "Skapa post"-knapp.

**Filer:**
- `apps/mobile/lib/data.ts` — post-helpers
- `apps/mobile/app/club/[id].tsx` — posts lista + admin-knapp
- `apps/mobile/app/club/[id]/new-post.tsx` — ny skärm

Lägg till i `apps/mobile/lib/data.ts`:

```typescript
import { ClubPost } from './types'

export async function getClubPosts(clubId: string): Promise<ClubPost[]> {
  if (!hasSupabaseConfig || !supabase) return []
  const { data, error } = await supabase
    .from('club_posts').select('*').eq('club_id', clubId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ClubPost[]
}

export async function isClubAdmin(clubId: string): Promise<boolean> {
  if (!supabase) return false
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  const { data } = await supabase
    .from('club_members').select('role')
    .eq('user_id', session.user.id).eq('club_id', clubId).maybeSingle()
  return !!data
}

export async function createClubPost(p: {
  clubId: string; title: string; body: string;
  eventAt?: string; location?: string
}): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { error } = await supabase.from('club_posts').insert({
    club_id: p.clubId, title: p.title, body: p.body,
    event_at: p.eventAt ?? null, location: p.location ?? null,
  })
  if (error) throw error
}
```

I `apps/mobile/app/club/[id].tsx`, uppdatera importer + lägg till state + rendering. **Full fil:**

```tsx
import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, Stack, useRouter } from 'expo-router'
import {
  getClubById, isFollowing, followClub, unfollowClub,
  getClubPosts, isClubAdmin,
} from '../../lib/data'
import { Club, ClubPost } from '../../lib/types'

export default function ClubProfile() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)
  const [posts, setPosts] = useState<ClubPost[]>([])
  const [admin, setAdmin] = useState(false)

  useEffect(() => {
    if (!id) return
    getClubById(id).then(setClub).finally(() => setLoading(false))
    isFollowing(id).then(setFollowing)
    getClubPosts(id).then(setPosts)
    isClubAdmin(id).then(setAdmin)
  }, [id])

  async function toggleFollow() {
    if (!id || followBusy) return
    setFollowBusy(true)
    try {
      if (following) { await unfollowClub(id); setFollowing(false) }
      else { await followClub(id); setFollowing(true) }
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte uppdatera följ-status')
    } finally {
      setFollowBusy(false)
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />
  if (!club) return <Text style={{ padding: 20 }}>Förening hittades inte</Text>

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: club.name, headerBackTitle: 'Tillbaka' }} />
      <View style={styles.header}>
        <Text style={styles.name}>{club.name}</Text>
        <Text style={styles.meta}>{club.city} · {club.sports.join(', ')}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.description}>{club.description}</Text>
        <Pressable
          style={[styles.followBtn, following && styles.followingBtn]}
          onPress={toggleFollow}
          disabled={followBusy}
        >
          <Text style={[styles.followText, following && styles.followingText]}>
            {followBusy ? '…' : following ? 'Följer ✓' : 'Följ förening'}
          </Text>
        </Pressable>

        {admin && (
          <Pressable style={styles.adminBtn} onPress={() => router.push(`/club/${id}/new-post`)}>
            <Text style={styles.adminBtnText}>+ Skapa post</Text>
          </Pressable>
        )}

        {club.website && <Text style={styles.link}>🌐 {club.website}</Text>}
        {club.contact_email && <Text style={styles.link}>✉️ {club.contact_email}</Text>}

        {posts.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Händelser</Text>
            {posts.map(p => (
              <View key={p.id} style={styles.postCard}>
                <Text style={styles.postTitle}>{p.title}</Text>
                {p.event_at && (
                  <Text style={styles.postDate}>
                    {new Date(p.event_at).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {p.location && ` · ${p.location}`}
                  </Text>
                )}
                <Text style={styles.postBody}>{p.body}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, backgroundColor: '#F1EFE8' },
  name: { fontSize: 24, fontWeight: '600', marginBottom: 6 },
  meta: { fontSize: 14, color: '#666' },
  body: { padding: 20 },
  description: { fontSize: 16, lineHeight: 24, color: '#333', marginBottom: 20 },
  followBtn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  followingBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#0F6E56' },
  followText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  followingText: { color: '#0F6E56' },
  link: { fontSize: 14, color: '#555', marginBottom: 6 },
  adminBtn: { backgroundColor: '#F1EFE8', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#0F6E56' },
  adminBtnText: { color: '#0F6E56', fontSize: 15, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#222' },
  postCard: { padding: 14, backgroundColor: '#fafafa', borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  postTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  postDate: { fontSize: 13, color: '#0F6E56', marginBottom: 6 },
  postBody: { fontSize: 14, color: '#333', lineHeight: 20 },
})
```

Skapa `apps/mobile/app/club/[id]/new-post.tsx`:
```tsx
import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { createClubPost } from '../../../lib/data'

export default function NewPost() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [location, setLocation] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!id || !title.trim() || !body.trim()) {
      Alert.alert('Fyll i titel och innehåll'); return
    }
    setBusy(true)
    try {
      await createClubPost({ clubId: id, title: title.trim(), body: body.trim(), location: location.trim() || undefined })
      router.back()
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte skapa post')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Skapa post' }} />
      <Text style={styles.label}>Titel</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />
      <Text style={styles.label}>Innehåll</Text>
      <TextInput style={[styles.input, styles.multiline]} value={body} onChangeText={setBody} multiline />
      <Text style={styles.label}>Plats (valfritt)</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} />
      <Pressable style={styles.btn} onPress={submit} disabled={busy}>
        <Text style={styles.btnText}>{busy ? '…' : 'Publicera'}</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  btn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
})
```

**Commit:** `BRIEF-UI-003: Club posts and admin create flow`

---

### BRIEF-UI-004: Feed-fliken

**Mål:** Flöde-fliken visar posts från följda föreningar, kronologiskt. Tom-state om inga följs.

Lägg till i `data.ts`:
```typescript
export type FeedPost = ClubPost & { club: { id: string; name: string; slug: string } }

export async function getFeed(): Promise<FeedPost[]> {
  if (!hasSupabaseConfig || !supabase) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const { data: followData } = await supabase
    .from('follows').select('club_id').eq('user_id', session.user.id)
  const clubIds = (followData ?? []).map((f: any) => f.club_id)
  if (clubIds.length === 0) return []

  const { data, error } = await supabase
    .from('club_posts')
    .select('*, clubs(id, name, slug)')
    .in('club_id', clubIds)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map((p: any) => ({ ...p, club: p.clubs })) as FeedPost[]
}
```

Skriv över `apps/mobile/app/(tabs)/feed.tsx`:
```tsx
import { useState, useCallback, useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { getFeed, FeedPost } from '../../lib/data'

export default function Feed() {
  const router = useRouter()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const p = await getFeed()
      setPosts(p)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <View style={styles.container}><Text style={styles.empty}>Laddar…</Text></View>

  if (posts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>
          Följ föreningar i Upptäck för att se deras inlägg här.
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={p => p.id}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/club/${item.club.id}`)}>
          <Text style={styles.clubName}>{item.club.name}</Text>
          <Text style={styles.title}>{item.title}</Text>
          {item.event_at && (
            <Text style={styles.date}>
              {new Date(item.event_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
              {item.location && ` · ${item.location}`}
            </Text>
          )}
          <Text style={styles.body} numberOfLines={3}>{item.body}</Text>
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  empty: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  card: { padding: 14, backgroundColor: '#fafafa', borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  clubName: { fontSize: 13, color: '#0F6E56', fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  date: { fontSize: 13, color: '#666', marginBottom: 6 },
  body: { fontSize: 14, color: '#333', lineHeight: 20 },
})
```

**Commit:** `BRIEF-UI-004: Feed from followed clubs`

---

### BRIEF-UI-005: Design-pass (badges + filter-chips)

**Mål:** Upptäck får sport-badges på kort + filter-chip-rad högst upp.

Skriv över `apps/mobile/app/(tabs)/index.tsx`:
```tsx
import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, TextInput, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { getClubs } from '../../lib/data'
import { Club } from '../../lib/types'
import { hasSupabaseConfig } from '../../lib/supabase'

const SPORT_COLORS: Record<string, { bg: string; fg: string }> = {
  hockey: { bg: '#E8F0FE', fg: '#1A73E8' },
  football: { bg: '#E6F4EA', fg: '#137333' },
  golf: { bg: '#FEF7E0', fg: '#B06000' },
  basketball: { bg: '#FCE8E6', fg: '#D93025' },
  triathlon: { bg: '#F3E8FD', fg: '#8430CE' },
}

const DEFAULT_BADGE = { bg: '#EEE', fg: '#444' }

const QUICK_FILTERS: Array<{ key: string; label: string }> = [
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
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    getClubs()
      .then(setClubs)
      .catch(err => console.error('Failed to load clubs', err))
      .finally(() => setLoading(false))
  }, [])

  const filtered = clubs.filter(c => {
    const matchesQuery =
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.sports.some(s => s.toLowerCase().includes(query.toLowerCase()))
    const matchesFilter = filter === 'all' || c.sports.includes(filter)
    return matchesQuery && matchesFilter
  })

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {QUICK_FILTERS.map(f => (
          <Pressable
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/club/${item.id}`)}
          >
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
          </Pressable>
        )}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  banner: { backgroundColor: '#FAEEDA', padding: 8 },
  bannerText: { textAlign: 'center', color: '#854F0B', fontSize: 12 },
  search: {
    margin: 16, marginBottom: 8, padding: 12,
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, fontSize: 16,
  },
  chipRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F1EFE8', marginRight: 8,
  },
  chipActive: { backgroundColor: '#0F6E56' },
  chipText: { fontSize: 14, color: '#444' },
  chipTextActive: { color: '#fff', fontWeight: '500' },
  card: {
    padding: 16, borderWidth: 1, borderColor: '#eee', borderRadius: 12,
    backgroundColor: '#fafafa',
  },
  name: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  city: { fontSize: 13, color: '#666', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginRight: 6 },
  badgeText: { fontSize: 11, fontWeight: '500', textTransform: 'capitalize' },
  desc: { fontSize: 14, color: '#333', lineHeight: 20 },
})
```

**Commit:** `BRIEF-UI-005: Sport badges and filter chips`

---

### BRIEF-UI-006: Events-flik i appen

**Mål:** Ny flik "Events" som visar kommande events. Klick → event-detaljsida. Användare kan anmäla sig.

**Filer:**
- `apps/mobile/app/(tabs)/_layout.tsx` — lägg till Events-flik
- `apps/mobile/app/(tabs)/events.tsx` — lista events
- `apps/mobile/app/event/[id].tsx` — event-detalj
- `apps/mobile/lib/data.ts` — event-helpers

Lägg till i `data.ts`:
```typescript
export type Event = {
  id: string
  club_id: string | null
  created_by: string
  title: string
  description: string
  location: string | null
  starts_at: string
  ends_at: string | null
  max_attendees: number | null
  is_public: boolean
  created_at: string
  club?: { id: string; name: string; slug: string }
}

export async function getUpcomingEvents(): Promise<Event[]> {
  if (!hasSupabaseConfig || !supabase) return []
  const { data, error } = await supabase
    .from('events')
    .select('*, clubs(id, name, slug)')
    .eq('is_public', true)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(50)
  if (error) throw error
  return (data ?? []).map((e: any) => ({ ...e, club: e.clubs })) as Event[]
}

export async function getEventById(id: string): Promise<Event | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('events').select('*, clubs(id, name, slug)').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? { ...data, club: (data as any).clubs } as Event : null
}

export async function isAttendingEvent(eventId: string): Promise<boolean> {
  if (!supabase) return false
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  const { data } = await supabase
    .from('event_attendees').select('status')
    .eq('event_id', eventId).eq('user_id', session.user.id).maybeSingle()
  return !!data && data.status === 'going'
}

export async function joinEvent(eventId: string): Promise<void> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const { error } = await supabase
    .from('event_attendees')
    .upsert({ event_id: eventId, user_id: session.user.id, status: 'going' })
  if (error) throw error
}

export async function leaveEvent(eventId: string): Promise<void> {
  if (!supabase) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  await supabase.from('event_attendees').delete()
    .eq('event_id', eventId).eq('user_id', session.user.id)
}
```

Lägg till Events-flik i tab-layouten. **Öppna `apps/mobile/app/(tabs)/_layout.tsx`** och lägg till en ny `<Tabs.Screen name="events" ... />` mellan "feed" och "profile".

Skapa `apps/mobile/app/(tabs)/events.tsx`:
```tsx
import { useState, useCallback, useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { getUpcomingEvents, Event } from '../../lib/data'

export default function Events() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try { setEvents(await getUpcomingEvents()) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <View style={styles.center}><Text>Laddar…</Text></View>

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        data={events}
        keyExtractor={e => e.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
        ListEmptyComponent={<Text style={styles.empty}>Inga kommande events. Skapa ett med + knappen.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/event/${item.id}`)}>
            {item.club && <Text style={styles.clubName}>{item.club.name}</Text>}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.date}>
              {new Date(item.starts_at).toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              {item.location && ` · ${item.location}`}
            </Text>
            <Text style={styles.body} numberOfLines={2}>{item.description}</Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/event/new')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 15 },
  card: { padding: 14, backgroundColor: '#fafafa', borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  clubName: { fontSize: 13, color: '#0F6E56', fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  date: { fontSize: 13, color: '#666', marginBottom: 6 },
  body: { fontSize: 14, color: '#333', lineHeight: 20 },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0F6E56', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
})
```

Skapa `apps/mobile/app/event/[id].tsx`:
```tsx
import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { getEventById, isAttendingEvent, joinEvent, leaveEvent, Event } from '../../lib/data'

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [ev, setEv] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [attending, setAttending] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    getEventById(id).then(setEv).finally(() => setLoading(false))
    isAttendingEvent(id).then(setAttending)
  }, [id])

  async function toggle() {
    if (!id || busy) return
    setBusy(true)
    try {
      if (attending) { await leaveEvent(id); setAttending(false) }
      else { await joinEvent(id); setAttending(true) }
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Något gick fel')
    } finally { setBusy(false) }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />
  if (!ev) return <Text style={{ padding: 20 }}>Event hittades inte</Text>

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: ev.title, headerBackTitle: 'Tillbaka' }} />
      <View style={styles.header}>
        {ev.club && <Text style={styles.clubName}>{ev.club.name}</Text>}
        <Text style={styles.title}>{ev.title}</Text>
        <Text style={styles.date}>
          {new Date(ev.starts_at).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
        </Text>
        {ev.location && <Text style={styles.location}>📍 {ev.location}</Text>}
      </View>
      <View style={styles.body}>
        <Text style={styles.description}>{ev.description}</Text>
        <Pressable
          style={[styles.btn, attending && styles.btnOn]}
          onPress={toggle}
          disabled={busy}
        >
          <Text style={[styles.btnText, attending && styles.btnTextOn]}>
            {busy ? '…' : attending ? 'Anmäld ✓' : 'Anmäl dig'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, backgroundColor: '#F1EFE8' },
  clubName: { fontSize: 13, color: '#0F6E56', fontWeight: '600', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 6 },
  date: { fontSize: 15, color: '#333', marginBottom: 4 },
  location: { fontSize: 14, color: '#555' },
  body: { padding: 20 },
  description: { fontSize: 16, lineHeight: 24, color: '#333', marginBottom: 20 },
  btn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnOn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#0F6E56' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  btnTextOn: { color: '#0F6E56' },
})
```

**Commit:** `BRIEF-UI-006: Events tab and detail view`

---

### BRIEF-UI-007: Skapa event (som inloggad user)

**Mål:** En "+ Skapa event"-knapp (FAB redan i UI-006) leder till form. Alla inloggade kan skapa event.

Lägg till i `data.ts`:
```typescript
export async function createEvent(p: {
  title: string; description: string; location?: string;
  startsAt: string; endsAt?: string; clubId?: string; maxAttendees?: number;
}): Promise<string> {
  if (!supabase) throw new Error('Not connected')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not logged in')
  const { data, error } = await supabase.from('events').insert({
    title: p.title, description: p.description,
    location: p.location ?? null, starts_at: p.startsAt,
    ends_at: p.endsAt ?? null, club_id: p.clubId ?? null,
    max_attendees: p.maxAttendees ?? null,
    created_by: session.user.id, is_public: true,
  }).select('id').single()
  if (error) throw error
  return data.id
}

export async function getMyAdminClubs(): Promise<Array<{id: string; name: string}>> {
  if (!supabase) return []
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  const { data } = await supabase
    .from('club_members')
    .select('clubs(id, name)')
    .eq('user_id', session.user.id)
    .in('role', ['admin', 'editor'])
  return (data ?? []).map((r: any) => r.clubs)
}
```

Skapa `apps/mobile/app/event/new.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { createEvent, getMyAdminClubs } from '../../lib/data'

export default function NewEvent() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [clubs, setClubs] = useState<Array<{id:string;name:string}>>([])
  const [clubId, setClubId] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)

  useEffect(() => { getMyAdminClubs().then(setClubs) }, [])

  async function submit() {
    if (!title.trim() || !description.trim() || !startsAt.trim()) {
      Alert.alert('Fyll i titel, beskrivning och starttid'); return
    }
    setBusy(true)
    try {
      const newId = await createEvent({
        title: title.trim(), description: description.trim(),
        location: location.trim() || undefined,
        startsAt: new Date(startsAt).toISOString(),
        clubId,
      })
      router.replace(`/event/${newId}`)
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte skapa event')
    } finally { setBusy(false) }
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Skapa event' }} />
      <Text style={styles.label}>Titel</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />
      <Text style={styles.label}>Beskrivning</Text>
      <TextInput style={[styles.input, styles.multi]} value={description} onChangeText={setDescription} multiline />
      <Text style={styles.label}>Plats</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} />
      <Text style={styles.label}>Starttid (YYYY-MM-DD HH:MM)</Text>
      <TextInput style={styles.input} value={startsAt} onChangeText={setStartsAt} placeholder="2026-05-01 18:00" />
      {clubs.length > 0 && (
        <>
          <Text style={styles.label}>Koppla till förening (valfritt)</Text>
          {[{ id: '', name: 'Ingen' }, ...clubs].map(c => (
            <Pressable
              key={c.id || 'none'}
              style={[styles.clubRow, (clubId ?? '') === c.id && styles.clubRowOn]}
              onPress={() => setClubId(c.id || undefined)}
            >
              <Text>{c.name}</Text>
            </Pressable>
          ))}
        </>
      )}
      <Pressable style={styles.btn} onPress={submit} disabled={busy}>
        <Text style={styles.btnText}>{busy ? '…' : 'Skapa event'}</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  multi: { minHeight: 100, textAlignVertical: 'top' },
  clubRow: { padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 6 },
  clubRowOn: { borderColor: '#0F6E56', backgroundColor: '#F1EFE8' },
  btn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
})
```

**Commit:** `BRIEF-UI-007: Create event screen`

---

### BRIEF-UI-008: Användarprofil med display_name

**Mål:** User kan ändra sitt namn + stad på profil-fliken.

Lägg till i `data.ts`:
```typescript
export type UserProfile = {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  city: string | null
}

export async function getMyProfile(): Promise<UserProfile | null> {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data, error } = await supabase
    .from('users').select('*').eq('id', session.user.id).maybeSingle()
  if (error) throw error
  return data as UserProfile
}

export async function updateMyProfile(p: { display_name?: string; city?: string }): Promise<void> {
  if (!supabase) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { error } = await supabase
    .from('users').update(p).eq('id', session.user.id)
  if (error) throw error
}
```

Uppdatera profil-fliken: visa display_name + email + city. Lägg till "Redigera profil"-knapp som går till `/edit-profile`.

Skapa `apps/mobile/app/edit-profile.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { getMyProfile, updateMyProfile } from '../lib/data'

export default function EditProfile() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyProfile().then(p => {
      if (p) {
        setDisplayName(p.display_name ?? '')
        setCity(p.city ?? '')
      }
    }).finally(() => setLoading(false))
  }, [])

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
  label: { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  btn: { backgroundColor: '#0F6E56', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
})
```

**Commit:** `BRIEF-UI-008: User profile editing`

---

## EFTER NIGHTLY-RUN-2

När alla briefs ovan är klara (eller BLOCKED), öppna **`docs/briefs/BRIEF-QUEUE.md`** och fortsätt med nästa brief där. Sluta inte förrän kön är tom eller du blockerats på 3+ briefs i rad.

---

## STATUS.md-format (Cowork skriver denna när klart)

```markdown
# Cowork körning — Status

Branch: claude/nightly-run-2
Started: YYYY-MM-DD HH:MM
Ended: YYYY-MM-DD HH:MM

## Briefs gjorda:
- [x] BRIEF-DB-002 — DONE
- [x] BRIEF-UI-002 — DONE
- [x] BRIEF-UI-003 — DONE
- [ ] BRIEF-UI-004 — BLOCKED (typecheck fail i feed.tsx, rad 42)
- [x] BRIEF-UI-005 — DONE

## Manuella steg imorgon:
1. Kör supabase/migrations/006_events_schema.sql i SQL Editor
2. Kör supabase/migrations/007_seed_lhc_content.sql i SQL Editor
3. git push origin claude/nightly-run-2
4. Skapa PR → merge till main

## Blockerade briefs — behöver FORGE reda ut:
- BRIEF-UI-004: <error-meddelande>
```

---

## DEL 3 — MORGONEN

1. Kolla `STATUS.md` i repo-roten
2. Kör migrations 006 + 007 i Supabase SQL Editor (om BRIEF-DB-002 är DONE)
3. Pusha branchen: `git push origin claude/nightly-run-2`
4. GitHub → skapa PR → merge till main
5. `git checkout main && git pull`
6. `cd apps\mobile && npx expo start --lan --clear`
7. Testa allt

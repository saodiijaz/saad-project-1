# BRIEF-IN-003: Push-notiser setup (Expo push)

## Status
🟡 **NEEDS-INPUT** — Körs INTE förrän Zivar har Expo-konto och åtkomst-token.

## Beslut som behövs
1. Har Zivar ett Expo-konto? (gratis på expo.dev) — JA/NEJ
2. Ska notiser skickas vid: (kryssa relevanta)
   - Ny post från följd förening
   - Ny vänförfrågan
   - Vänförfrågan accepterad
   - Kommentar på dina posts
   - Like på dina posts
   - Påminnelse inför event du anmält dig till (2h innan)

Rekommendation MVP: bara event-påminnelser + vänförfrågningar (undvik notis-spam).

## Mål (hög-nivå)
1. Appen ber om notis-tillstånd vid första start
2. Expo push token sparas per user i DB
3. Edge function (Supabase) triggas vid relevanta event och skickar notis via Expo API

## Förutsättningar
- Expo-konto + access-token
- Supabase Edge Functions enabled

## Berörda filer (skisserat)
- `apps/mobile/lib/push.ts` — ny (register + save token)
- `apps/mobile/app/_layout.tsx` — kalla registerForPushNotifications vid mount
- `supabase/migrations/013_push_tokens.sql` — ny tabell `user_push_tokens`
- `supabase/functions/send-push/index.ts` — edge function
- DB triggers som anropar edge function

## Skisserad setup

Installation:
```bash
cd apps/mobile
npx expo install expo-notifications expo-device
```

Schema (placeholder):
```sql
create table public.user_push_tokens (
  user_id uuid references public.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);
alter table public.user_push_tokens enable row level security;
create policy "Users manage own tokens" on public.user_push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Register-funktion (skiss):
```typescript
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { supabase } from './supabase'

export async function registerForPush() {
  if (!Device.isDevice) return null
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let status = existingStatus
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync()
    status = req.status
  }
  if (status !== 'granted') return null
  const token = (await Notifications.getExpoPushTokenAsync()).data
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  await supabase.from('user_push_tokens').upsert({
    user_id: session.user.id,
    token,
    platform: Device.osName?.toLowerCase() === 'ios' ? 'ios' : 'android',
  })
  return token
}
```

## Steg — placeholder
Fylls i när Zivar bekräftat Expo-konto. Kommer innehålla:
1. Schema migration
2. register-funktion + anrop vid app-start
3. Edge function send-push (med rate limiting)
4. DB-triggers (eller cron jobs) som anropar edge function

## Verifiering
- [ ] Test-notis från https://expo.dev/notifications når enheten
- [ ] Vänförfrågan triggar notis (end-to-end test)

## Anti-patterns
- Spama INTE med notiser per default — opt-in per typ rekommenderas
- Spara aldrig Expo access-token på enheten — bara på server

## Commit (när klart)
`BRIEF-IN-003: Expo push notifications setup`

---

**Cowork:** Hoppa denna brief tills Zivar svarat via ny brief-revision.

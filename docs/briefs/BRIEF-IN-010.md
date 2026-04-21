# BRIEF-IN-010: Analytics scaffolding (PostHog-redo)

## Status
✅ READY — scaffolding utan extern dependency. PostHog-klient kan kopplas in senare.

## Mål
Lägg en ultra-tunn `lib/analytics.ts` som fungerar som no-op i nuläget men ger oss ett ställe att registrera event-tracking calls på. När Zivar senare vill aktivera PostHog/Mixpanel/etc räcker det att ändra backend i denna fil.

## Blockerad av
Inget. Ingen ny dep i denna brief.

## Berörda filer
- `apps/mobile/lib/analytics.ts` — ny
- `apps/mobile/app/(tabs)/index.tsx` — tracka Discover-öppningar
- `apps/mobile/app/club/[id].tsx` — tracka klubb-visning + follow
- `apps/mobile/app/event/new.tsx` — tracka event_created

## Steg

### 1. `lib/analytics.ts`
```typescript
type Props = Record<string, string | number | boolean | null>

let initialized = false
let backend: 'noop' | 'console' = __DEV__ ? 'console' : 'noop'

export function initAnalytics() {
  initialized = true
}

export function track(event: string, props?: Props) {
  if (!initialized) initAnalytics()
  if (backend === 'console' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, props ?? {})
  }
  // Hook in PostHog here when ready:
  // posthog.capture(event, props)
}
```

### 2. Använd helper i några ställen
- `discover_opened` i Discover
- `club_viewed` + `club_followed` / `club_unfollowed` i ClubProfile
- `event_created` i event/new efter success

## Verifiering
- [ ] Öppna Discover → `[analytics] discover_opened` loggas i dev-mode
- [ ] Följ klubb → `[analytics] club_followed {id}` loggas
- [ ] Skapa event → `[analytics] event_created` loggas

## Commit
`BRIEF-IN-010: Analytics scaffolding (no-op backend, ready for PostHog)`

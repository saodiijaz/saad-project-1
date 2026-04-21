// React Native exponerar __DEV__ som en global. Deklarera typen här för
// strict TypeScript så vi inte behöver en separat env.d.ts.
declare const __DEV__: boolean

type Props = Record<string, string | number | boolean | null | undefined>

let initialized = false
// 'console' loggar till dev-konsolen i development; 'noop' gör inget.
// Byt till 'posthog' (eller liknande) när en riktig backend kopplas in.
type Backend = 'noop' | 'console'
const backend: Backend = typeof __DEV__ !== 'undefined' && __DEV__ ? 'console' : 'noop'

export function initAnalytics(): void {
  initialized = true
}

export function track(event: string, props?: Props): void {
  if (!initialized) initAnalytics()
  if (backend === 'console') {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[analytics] ${event}`, props ?? {})
    }
    return
  }
  // Hook in PostHog / Mixpanel here when a real backend is wired up:
  // posthog.capture(event, props)
}

export function identify(userId: string, traits?: Props): void {
  if (!initialized) initAnalytics()
  if (backend === 'console' && typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] identify ${userId}`, traits ?? {})
  }
  // posthog.identify(userId, traits)
}

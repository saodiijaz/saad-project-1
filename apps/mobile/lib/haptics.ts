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

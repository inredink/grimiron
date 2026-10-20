import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let hapticsGloballyEnabled = true;

/**
 * Updates the global haptic feedback state based on user settings.
 */
export function setHapticsEnabled(enabled: boolean): void {
  hapticsGloballyEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsGloballyEnabled;
}

/**
 * Tactical haptic feedback helper for GrimIron workout RPG.
 * Provides distinct physical sensations for exercise tracking,
 * combat strikes, critical hits, timer alerts, and victories.
 * Gracefully no-ops on web, unsupported platforms, or when disabled in Settings.
 */
export const triggerHaptic = {
  /**
   * Subtle tap for standard UI buttons, tab switches, and filters.
   */
  light: () => {
    if (!hapticsGloballyEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    } catch {}
  },

  /**
   * Solid physical impact when checking off a completed workout set.
   */
  medium: () => {
    if (!hapticsGloballyEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
    } catch {}
  },

  /**
   * Heavy visceral shock when a set lands a Critical Strike on an enemy or boss.
   */
  heavy: () => {
    if (!hapticsGloballyEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      }
    } catch {}
  },

  /**
   * Success notification vibration for completing a workout, slaying a boss,
   * earning rank promotion, or claiming rewards.
   */
  success: () => {
    if (!hapticsGloballyEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch {}
  },

  /**
   * Warning vibration when the rest timer reaches 0, or when aborting a mission.
   */
  warning: () => {
    if (!hapticsGloballyEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
    } catch {}
  },

  /**
   * Micro-tick for picker wheels and tab switching.
   */
  selection: () => {
    if (!hapticsGloballyEnabled) return;
    try {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync().catch(() => {});
      }
    } catch {}
  },
};

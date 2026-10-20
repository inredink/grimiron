import { Platform } from 'react-native';

let keepAwakeModule: any = null;

try {
  // Dynamically require expo-keep-awake to prevent bundler errors if native code is absent
  keepAwakeModule = require('expo-keep-awake');
} catch {
  keepAwakeModule = null;
}

let isCurrentlyActive = false;

/**
 * Activates screen keep-awake if enabled by user settings and supported by the device.
 * Used during active workout sessions to prevent the display from sleeping.
 */
export async function activateWorkoutKeepAwake(enabled: boolean = true): Promise<boolean> {
  if (!enabled || Platform.OS === 'web' || !keepAwakeModule) {
    return false;
  }

  try {
    if (typeof keepAwakeModule.activateKeepAwakeAsync === 'function') {
      await keepAwakeModule.activateKeepAwakeAsync('grimiron_workout');
      isCurrentlyActive = true;
      return true;
    }
  } catch (err) {
    console.warn('Failed to activate keep-awake:', err);
  }
  return false;
}

/**
 * Releases screen keep-awake when a workout is completed, cancelled, or the screen unmounts.
 */
export async function deactivateWorkoutKeepAwake(): Promise<void> {
  if (!isCurrentlyActive || Platform.OS === 'web' || !keepAwakeModule) {
    return;
  }

  try {
    if (typeof keepAwakeModule.deactivateKeepAwake === 'function') {
      await keepAwakeModule.deactivateKeepAwake('grimiron_workout');
    }
    isCurrentlyActive = false;
  } catch (err) {
    console.warn('Failed to deactivate keep-awake:', err);
  }
}

export function isKeepAwakeActive(): boolean {
  return isCurrentlyActive;
}

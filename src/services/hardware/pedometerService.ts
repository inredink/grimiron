import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { getDailyStepRecord, saveDailyStepRecord } from '../database/biometricsRepository';

export interface PedometerStatus {
  isAvailable: boolean;
  hasPermission: boolean;
  error?: string;
}

let activeSubscription: { remove: () => void } | null = null;
let sessionStepsAccumulator = 0;

/**
 * Checks if hardware pedometer sensors exist and are accessible on this device.
 */
export async function checkPedometerAvailability(): Promise<PedometerStatus> {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      return { isAvailable: false, hasPermission: false };
    }

    const perm = await Pedometer.getPermissionsAsync();
    return {
      isAvailable: true,
      hasPermission: perm.granted,
    };
  } catch (err: any) {
    return {
      isAvailable: false,
      hasPermission: false,
      error: err?.message || 'Hardware pedometer unavailable',
    };
  }
}

/**
 * Requests motion/activity permissions from the operating system.
 */
export async function requestPedometerPermission(): Promise<boolean> {
  try {
    const perm = await Pedometer.requestPermissionsAsync();
    return perm.granted;
  } catch {
    return false;
  }
}

/**
 * Starts continuous tracking of steps while the app is active in the foreground.
 */
export function startForegroundPedometerTracking(onStepsChanged?: (totalToday: number) => void): boolean {
  if (activeSubscription) {
    return true; // Already listening
  }

  try {
    sessionStepsAccumulator = 0;
    activeSubscription = Pedometer.watchStepCount((result) => {
      if (result && typeof result.steps === 'number') {
        const delta = Math.max(0, result.steps - sessionStepsAccumulator);
        if (delta > 0) {
          sessionStepsAccumulator = result.steps;
          const currentRec = getDailyStepRecord();
          const newTotal = (currentRec?.steps || 0) + delta;
          const { record } = saveDailyStepRecord(newTotal);
          if (onStepsChanged) {
            onStepsChanged(record.steps);
          }
        }
      }
    });
    return true;
  } catch (err) {
    console.warn('Failed to start pedometer subscription:', err);
    return false;
  }
}

/**
 * Stops active foreground tracking.
 */
export function stopForegroundPedometerTracking(): void {
  if (activeSubscription) {
    try {
      activeSubscription.remove();
    } catch {}
    activeSubscription = null;
  }
}

/**
 * Syncs steps from iOS CMPedometer if on iOS, or returns current stored records.
 */
export async function syncPedometerSteps(): Promise<{ steps: number; isAvailable: boolean }> {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      const current = getDailyStepRecord()?.steps || 0;
      return { steps: current, isAvailable: false };
    }

    if (Platform.OS === 'ios') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const now = new Date();

      const result = await Pedometer.getStepCountAsync(startOfDay, now);
      if (result && typeof result.steps === 'number') {
        const currentRec = getDailyStepRecord();
        const effectiveSteps = Math.max(currentRec?.steps || 0, result.steps);
        const { record } = saveDailyStepRecord(effectiveSteps);
        return { steps: record.steps, isAvailable: true };
      }
    }

    const current = getDailyStepRecord()?.steps || 0;
    return { steps: current, isAvailable: true };
  } catch (err) {
    console.warn('Pedometer sync warning:', err);
    const current = getDailyStepRecord()?.steps || 0;
    return { steps: current, isAvailable: false };
  }
}

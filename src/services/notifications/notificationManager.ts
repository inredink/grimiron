import { AppSettings } from '../../types/settings';

export type NotificationCategory =
  | 'workout'
  | 'rest_timer'
  | 'recovery'
  | 'mission'
  | 'boss'
  | 'squad'
  | 'achievement'
  | 'promotion'
  | 'weekly_summary';

export interface NotificationStorageAdapter {
  savePendingNotification(
    id: string,
    category: NotificationCategory,
    title: string,
    subtitle: string,
    detailsJson: string | null,
    createdAt: string
  ): void;
}

export const inMemoryNotificationStorage: NotificationStorageAdapter = {
  savePendingNotification: () => {},
};

let currentNotificationStorage: NotificationStorageAdapter = inMemoryNotificationStorage;

export function setNotificationStorageAdapter(adapter: NotificationStorageAdapter): void {
  currentNotificationStorage = adapter;
}

/**
 * Checks if current local time falls within configured Quiet Hours.
 * Supports intervals that cross midnight (e.g. 22:00 to 08:00).
 */
export function isInQuietHours(
  now: Date = new Date(),
  startStr: string = '22:00',
  endStr: string = '08:00'
): boolean {
  try {
    const [startH, startM] = startStr.split(':').map((n) => parseInt(n, 10));
    const [endH, endM] = endStr.split(':').map((n) => parseInt(n, 10));

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      // Standard daytime quiet interval (e.g., 13:00 to 15:00)
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight interval crossing midnight (e.g., 22:00 to 08:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  } catch {
    return false;
  }
}

/**
 * Determines whether a notification in the given category is permitted
 * based on user settings, toggles, and quiet hours.
 */
export function shouldDispatchNotification(
  category: NotificationCategory,
  settings: AppSettings,
  now: Date = new Date()
): { allowed: boolean; reason?: string } {
  // 1. Check Quiet Hours for non-essential notifications (rest_timer during workout is in-session, not suppressed)
  if (category !== 'rest_timer' && settings.notif_quiet_hours_enabled) {
    if (isInQuietHours(now, settings.notif_quiet_hours_start, settings.notif_quiet_hours_end)) {
      return { allowed: false, reason: 'Suppressed by Quiet Hours.' };
    }
  }

  // 2. Check category-specific user preference
  switch (category) {
    case 'workout':
      return { allowed: settings.notif_workout_reminders };
    case 'rest_timer':
      return { allowed: settings.notif_rest_timer };
    case 'recovery':
      return { allowed: settings.notif_recovery_reminders };
    case 'mission':
      return {
        allowed: settings.notif_mission_updates && settings.rpg_notify_new_missions,
      };
    case 'boss':
      return {
        allowed: settings.notif_boss_alerts && settings.rpg_notify_raid_new,
      };
    case 'squad':
      return { allowed: settings.notif_squad_activity };
    case 'achievement':
      return { allowed: settings.notif_achievements };
    case 'promotion':
      return { allowed: settings.notif_promotions };
    case 'weekly_summary':
      return { allowed: settings.notif_weekly_summary };
    default:
      return { allowed: true };
  }
}

/**
 * Dispatches an in-app tactical notification to storage if permitted by user settings.
 */
export function dispatchTacticalNotification(
  category: NotificationCategory,
  title: string,
  subtitle: string,
  details: any = null,
  settings: AppSettings
): boolean {
  const check = shouldDispatchNotification(category, settings);
  if (!check.allowed) {
    return false;
  }

  try {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const detailsJson = details ? JSON.stringify(details) : null;

    currentNotificationStorage.savePendingNotification(
      id,
      category,
      title,
      subtitle,
      detailsJson,
      now
    );
    return true;
  } catch (err) {
    console.error('Failed to dispatch tactical notification:', err);
    return false;
  }
}

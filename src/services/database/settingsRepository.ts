import { getDatabase } from './db';
import { AppSettings, DEFAULT_APP_SETTINGS } from '../../types/settings';

/**
 * Loads all settings from the database, merging them with default settings.
 * Ensures that if any setting key is missing, the default is returned.
 */
export function getAllSettings(): AppSettings {
  const db = getDatabase();
  try {
    const rows = db.getAllSync<{ key: string; value_json: string }>(
      'SELECT key, value_json FROM app_settings;'
    );

    const settings: Partial<AppSettings> = {};
    for (const row of rows) {
      try {
        (settings as any)[row.key] = JSON.parse(row.value_json);
      } catch {
        // Fallback to default if JSON parse fails
      }
    }

    return {
      ...DEFAULT_APP_SETTINGS,
      ...settings,
    };
  } catch (err) {
    console.warn('Failed to load settings from database, using defaults:', err);
    return { ...DEFAULT_APP_SETTINGS };
  }
}

/**
 * Gets a single setting value with type safety and fallback to default.
 */
export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  const db = getDatabase();
  try {
    const row = db.getFirstSync<{ value_json: string }>(
      'SELECT value_json FROM app_settings WHERE key = ?;',
      [key]
    );

    if (row && row.value_json) {
      try {
        return JSON.parse(row.value_json) as AppSettings[K];
      } catch {}
    }
  } catch (err) {
    console.warn(`Failed to read setting ${key}:`, err);
  }

  return DEFAULT_APP_SETTINGS[key];
}

/**
 * Saves or updates a setting in the database.
 */
export function saveSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): void {
  const db = getDatabase();
  try {
    const valueJson = JSON.stringify(value);
    const now = new Date().toISOString();

    db.runSync(
      `INSERT INTO app_settings (key, value_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value_json = excluded.value_json,
         updated_at = excluded.updated_at;`,
      [key, valueJson, now]
    );
  } catch (err) {
    console.error(`Failed to save setting ${key}:`, err);
    throw err;
  }
}

/**
 * Resets all settings to default values, preserving the onboarding completion flag
 * so that users resetting workout preferences are not forced back into onboarding.
 */
export function resetAllSettings(): AppSettings {
  const db = getDatabase();
  const wasOnboardingCompleted = getSetting('onboarding_completed');
  try {
    db.runSync("DELETE FROM app_settings WHERE key != 'onboarding_completed';");
  } catch (err) {
    console.error('Failed to reset settings:', err);
  }
  return {
    ...DEFAULT_APP_SETTINGS,
    onboarding_completed: wasOnboardingCompleted,
  };
}

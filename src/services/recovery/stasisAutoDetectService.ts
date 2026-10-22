import { logStasisSleep, isWellRestedToday, getRecentSleepRecords } from '../database/biometricsRepository';

declare const require: any;

export interface StasisAutoEvaluationResult {
  detected: boolean;
  elapsedHours: number;
  newlyAwardedXp: number;
  isWellRested: boolean;
  message?: string;
}

let inMemoryLastBackgroundTimestamp: number | null = null;

/**
 * Persists the timestamp when the app/phone transitions to background or screen-off.
 */
export function recordStasisBackgroundTime(timestampMs: number = Date.now()): void {
  inMemoryLastBackgroundTimestamp = timestampMs;
  try {
    const { getDatabase } = require('../database/db');
    const db = getDatabase();
    db.runSync(
      `INSERT INTO auth_session_store (key, value, updated_at)
       VALUES ('stasis_last_background_timestamp', ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [String(timestampMs)]
    );
  } catch {
    // Falls back gracefully in tests/in-memory
  }
}

/**
 * Retrieves the recorded background timestamp.
 */
export function getLastStasisBackgroundTime(): number | null {
  if (inMemoryLastBackgroundTimestamp !== null) {
    return inMemoryLastBackgroundTimestamp;
  }
  try {
    const { getDatabase } = require('../database/db');
    const db = getDatabase();
    const row: any = db.getFirstSync(
      "SELECT value FROM auth_session_store WHERE key = 'stasis_last_background_timestamp'"
    );
    if (row && row.value) {
      const parsed = parseInt(row.value, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

/**
 * Resets or clears background timestamp (useful for testing).
 */
export function clearStasisBackgroundTime(): void {
  inMemoryLastBackgroundTimestamp = null;
  try {
    const { getDatabase } = require('../database/db');
    const db = getDatabase();
    db.runSync("DELETE FROM auth_session_store WHERE key = 'stasis_last_background_timestamp'");
  } catch {}
}

/**
 * Evaluates the period of phone/app inactivity against the 7+ hours rest threshold.
 * If inactivity >= 7.0 hours, automatically credits Stasis Sleep and grants the
 * Well-Rested combat protocol (+5% DMG).
 */
export function evaluateInactivityAndAutoLogStasis(
  currentTimeMs: number = Date.now(),
  forcedBackgroundTimeMs?: number
): StasisAutoEvaluationResult {
  let isAutoDetectEnabled = true;
  try {
    const { getSetting } = require('../database/settingsRepository');
    isAutoDetectEnabled = getSetting('training_auto_stasis_inactivity_enabled') !== false;
  } catch {
    isAutoDetectEnabled = true;
  }
  if (!isAutoDetectEnabled) {
    return { detected: false, elapsedHours: 0, newlyAwardedXp: 0, isWellRested: false };
  }

  const backgroundTime = forcedBackgroundTimeMs !== undefined
    ? forcedBackgroundTimeMs
    : getLastStasisBackgroundTime();

  if (!backgroundTime || backgroundTime >= currentTimeMs) {
    recordStasisBackgroundTime(currentTimeMs);
    return { detected: false, elapsedHours: 0, newlyAwardedXp: 0, isWellRested: false };
  }

  const diffMs = currentTimeMs - backgroundTime;
  const elapsedHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

  // Threshold: 7.0+ hours of phone/app inactivity
  if (elapsedHours >= 7.0) {
    const alreadyRestedToday = isWellRestedToday();
    let newlyAwardedXp = 0;

    if (!alreadyRestedToday) {
      const result = logStasisSleep(elapsedHours);
      newlyAwardedXp = result.auxXpAwarded;
    }

    // Reset background timestamp to current wake time
    recordStasisBackgroundTime(currentTimeMs);

    return {
      detected: true,
      elapsedHours,
      newlyAwardedXp,
      isWellRested: true,
      message: `Apothecarion Stasis Auto-Rest: ${elapsedHours} hrs of stillness detected. Well-Rested Protocol activated (+5% DMG)!`,
    };
  }

  // Under 7.0 hours: not enough for full stasis recovery
  recordStasisBackgroundTime(currentTimeMs);
  return {
    detected: false,
    elapsedHours,
    newlyAwardedXp: 0,
    isWellRested: isWellRestedToday(),
  };
}

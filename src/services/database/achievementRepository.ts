import { getDatabase } from './db';
import {
  AchievementAward,
  AchievementProgress,
  AchievementScope,
} from '../../types/achievements';

interface AchievementAwardRow {
  id: string;
  achievement_id: string;
  scope: string;
  target_id: string;
  tier: number;
  unlocked_at: string;
  source_event_type: string;
  source_ref_id: string | null;
  reward_xp: number;
  reward_claimed: number;
}

interface AchievementProgressRow {
  id: string;
  achievement_id: string;
  scope: string;
  target_id: string;
  current_value: number;
  target_value: number;
  is_completed: number;
  last_updated_at: string;
}

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  details_json: string | null;
  created_at: string;
  is_dismissed: number;
}

/**
 * Idempotently records an achievement award.
 * Returns true if newly awarded, false if already awarded (duplicate prevented).
 */
export function awardAchievement(award: AchievementAward): boolean {
  const db = getDatabase();

  try {
    const changes = db.runSync(
      `INSERT OR IGNORE INTO achievement_awards (
        id, achievement_id, scope, target_id, tier,
        unlocked_at, source_event_type, source_ref_id,
        reward_xp, reward_claimed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        award.id,
        award.achievementId,
        award.scope,
        award.targetId,
        award.tier || 1,
        award.unlockedAt || new Date().toISOString(),
        award.sourceEventType,
        award.sourceRefId || null,
        award.rewardXp || 0,
        award.rewardClaimed ? 1 : 0,
      ]
    );

    return changes.changes > 0;
  } catch (err) {
    console.warn(`Duplicate or error awarding achievement ${award.achievementId}:`, err);
    return false;
  }
}

/**
 * Retrieves all awards for a specific scope and target (e.g. user, character, or squad).
 */
export function getAwardsForTarget(
  scope: AchievementScope,
  targetId: string
): AchievementAward[] {
  const db = getDatabase();
  const rows = db.getAllSync<AchievementAwardRow>(
    'SELECT * FROM achievement_awards WHERE scope = ? AND target_id = ? ORDER BY unlocked_at DESC',
    [scope, targetId]
  );
  return rows.map(mapAwardRow);
}

/**
 * Retrieves all earned awards across the entire application.
 */
export function getAllAwards(): AchievementAward[] {
  const db = getDatabase();
  const rows = db.getAllSync<AchievementAwardRow>(
    'SELECT * FROM achievement_awards ORDER BY unlocked_at DESC'
  );
  return rows.map(mapAwardRow);
}

/**
 * Checks whether an achievement has already been awarded.
 */
export function isAchievementAwarded(
  achievementId: string,
  scope: AchievementScope,
  targetId: string
): boolean {
  const db = getDatabase();
  const row = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM achievement_awards WHERE achievement_id = ? AND scope = ? AND target_id = ?',
    [achievementId, scope, targetId]
  );
  return (row?.count || 0) > 0;
}

/**
 * Saves or updates progress for an achievement.
 */
export function saveAchievementProgress(progress: AchievementProgress): void {
  const db = getDatabase();
  const id = `prog_${progress.achievementId}_${progress.targetId}`;

  db.runSync(
    `INSERT INTO achievement_progress (
      id, achievement_id, scope, target_id,
      current_value, target_value, is_completed, last_updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(achievement_id, scope, target_id) DO UPDATE SET
      current_value = excluded.current_value,
      target_value = excluded.target_value,
      is_completed = excluded.is_completed,
      last_updated_at = excluded.last_updated_at`,
    [
      id,
      progress.achievementId,
      progress.scope,
      progress.targetId,
      progress.currentValue,
      progress.targetValue,
      progress.isCompleted ? 1 : 0,
      progress.lastUpdatedAt || new Date().toISOString(),
    ]
  );
}

/**
 * Retrieves progress for a specific achievement and target.
 */
export function getProgressForAchievement(
  achievementId: string,
  scope: AchievementScope,
  targetId: string
): AchievementProgress | null {
  const db = getDatabase();
  const row = db.getFirstSync<AchievementProgressRow>(
    'SELECT * FROM achievement_progress WHERE achievement_id = ? AND scope = ? AND target_id = ?',
    [achievementId, scope, targetId]
  );
  if (!row) return null;
  return mapProgressRow(row);
}

/**
 * Retrieves all stored progress rows.
 */
export function getAllAchievementProgress(): AchievementProgress[] {
  const db = getDatabase();
  const rows = db.getAllSync<AchievementProgressRow>(
    'SELECT * FROM achievement_progress'
  );
  return rows.map(mapProgressRow);
}

/**
 * Queues an achievement notification for display.
 */
export function queueAchievementNotification(
  title: string,
  subtitle: string,
  details?: any
): void {
  const db = getDatabase();
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  db.runSync(
    `INSERT INTO pending_notifications (
      id, type, title, subtitle, details_json, created_at, is_dismissed
    ) VALUES (?, 'achievement_award', ?, ?, ?, ?, 0)`,
    [
      id,
      title,
      subtitle,
      details ? JSON.stringify(details) : null,
      new Date().toISOString(),
    ]
  );
}

/**
 * Fetches un-dismissed notifications.
 */
export function getPendingNotifications(): Array<{
  id: string;
  type: string;
  title: string;
  subtitle: string;
  details?: any;
  createdAt: string;
}> {
  const db = getDatabase();
  const rows = db.getAllSync<NotificationRow>(
    'SELECT * FROM pending_notifications WHERE is_dismissed = 0 ORDER BY created_at ASC'
  );

  return rows.map((r) => {
    let details: any;
    try {
      details = r.details_json ? JSON.parse(r.details_json) : undefined;
    } catch {
      details = undefined;
    }
    return {
      id: r.id,
      type: r.type,
      title: r.title,
      subtitle: r.subtitle,
      details,
      createdAt: r.created_at,
    };
  });
}

/**
 * Marks a notification as dismissed.
 */
export function dismissNotification(notificationId: string): void {
  const db = getDatabase();
  db.runSync(
    'UPDATE pending_notifications SET is_dismissed = 1 WHERE id = ?',
    [notificationId]
  );
}

/**
 * Clears any erroneously awarded achievements and notifications for an initiate who has
 * never completed any workouts or combat battles.
 */
export function clearUnearnedInitiateAchievements(): void {
  const db = getDatabase();
  try {
    const woRow = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM workout_sessions WHERE is_completed = 1'
    );
    const combatRow = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM combat_encounters WHERE is_defeated = 1'
    );
    if ((woRow?.count || 0) === 0 && (combatRow?.count || 0) === 0) {
      db.runSync('DELETE FROM achievement_awards;');
      db.runSync('DELETE FROM achievement_progress;');
      db.runSync("DELETE FROM pending_notifications WHERE type = 'achievement';");
    }
  } catch (err) {
    console.warn('Initiate achievement check skipped:', err);
  }
}

function mapAwardRow(row: AchievementAwardRow): AchievementAward {
  return {
    id: row.id,
    achievementId: row.achievement_id,
    scope: row.scope as any,
    targetId: row.target_id,
    tier: row.tier,
    unlockedAt: row.unlocked_at,
    sourceEventType: row.source_event_type,
    sourceRefId: row.source_ref_id || undefined,
    rewardXp: row.reward_xp,
    rewardClaimed: row.reward_claimed === 1,
  };
}

function mapProgressRow(row: AchievementProgressRow): AchievementProgress {
  const progressPercent = Math.min(
    100,
    Math.round((row.current_value / Math.max(1, row.target_value)) * 100)
  );
  return {
    id: row.id,
    achievementId: row.achievement_id,
    scope: row.scope as any,
    targetId: row.target_id,
    currentValue: row.current_value,
    targetValue: row.target_value,
    progressPercent,
    isCompleted: row.is_completed === 1,
    lastUpdatedAt: row.last_updated_at,
  };
}

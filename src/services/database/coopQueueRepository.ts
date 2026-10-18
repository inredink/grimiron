import { getDatabase } from './db';
import {
  ActiveCoopRaid,
  CoopAttackPayload,
  CoopAttackQueueItem,
} from '../../types/coop';

interface CoopQueueRow {
  id: string;
  group_boss_id: string;
  client_set_id: string;
  exercise_name: string;
  attack_name: string;
  style_name: string;
  damage: number;
  created_at: string;
  synced_at: string | null;
  sync_error: string | null;
}

interface ActiveRaidRow {
  id: number;
  group_id: string;
  group_name: string;
  boss_id: string;
  boss_name: string;
  boss_faction: string;
  boss_lore: string;
  boss_glyph: string;
  boss_max_hp: number;
  boss_current_hp: number;
  is_defeated: number;
  updated_at: string;
}

function mapRowToQueueItem(row: CoopQueueRow): CoopAttackQueueItem {
  return {
    id: row.id,
    groupBossId: row.group_boss_id,
    clientSetId: row.client_set_id,
    exerciseName: row.exercise_name,
    attackName: row.attack_name,
    styleName: row.style_name,
    damage: row.damage,
    createdAt: row.created_at,
    syncedAt: row.synced_at,
    syncError: row.sync_error,
  };
}

/**
 * Enqueues an attack locally for offline resilience and idempotency.
 * If an attack for client_set_id is already enqueued, returns the existing record.
 */
export function enqueueCoopAttack(payload: CoopAttackPayload): CoopAttackQueueItem {
  const db = getDatabase();

  const existing = db.getFirstSync<CoopQueueRow>(
    'SELECT * FROM coop_attack_queue WHERE client_set_id = ?',
    [payload.clientSetId]
  );

  if (existing) {
    return mapRowToQueueItem(existing);
  }

  const id = `queue_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO coop_attack_queue (
      id, group_boss_id, client_set_id, exercise_name,
      attack_name, style_name, damage, created_at, synced_at, sync_error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
    [
      id,
      payload.groupBossId,
      payload.clientSetId,
      payload.exerciseName,
      payload.attackName,
      payload.styleName,
      payload.damage,
      now,
    ]
  );

  return {
    id,
    groupBossId: payload.groupBossId,
    clientSetId: payload.clientSetId,
    exerciseName: payload.exerciseName,
    attackName: payload.attackName,
    styleName: payload.styleName,
    damage: payload.damage,
    createdAt: now,
    syncedAt: null,
    syncError: null,
  };
}

/**
 * Returns all attacks waiting to be synced to Supabase.
 */
export function getUnsyncedAttacks(limit: number = 50): CoopAttackQueueItem[] {
  const db = getDatabase();
  const rows = db.getAllSync<CoopQueueRow>(
    'SELECT * FROM coop_attack_queue WHERE synced_at IS NULL ORDER BY created_at ASC LIMIT ?',
    [limit]
  );
  return rows.map(mapRowToQueueItem);
}

/**
 * Marks an attack as successfully sent to the remote database.
 */
export function markAttackSynced(clientSetId: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    'UPDATE coop_attack_queue SET synced_at = ?, sync_error = NULL WHERE client_set_id = ?',
    [now, clientSetId]
  );
}

/**
 * Records a sync failure error without dropping the queued attack.
 */
export function markAttackFailed(clientSetId: string, error: string): void {
  const db = getDatabase();
  db.runSync(
    'UPDATE coop_attack_queue SET sync_error = ? WHERE client_set_id = ?',
    [error, clientSetId]
  );
}

/**
 * Returns queue count summary (pending vs synced).
 */
export function getQueueStats(): { pending: number; synced: number } {
  const db = getDatabase();
  const pendingRow = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM coop_attack_queue WHERE synced_at IS NULL'
  );
  const syncedRow = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM coop_attack_queue WHERE synced_at IS NOT NULL'
  );

  return {
    pending: pendingRow?.count ?? 0,
    synced: syncedRow?.count ?? 0,
  };
}

/**
 * Caches the active co-op raid locally so offline workouts still target the shared boss.
 */
export function saveActiveRaid(raid: ActiveCoopRaid): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT OR REPLACE INTO coop_active_raid (
      id, group_id, group_name, boss_id, boss_name,
      boss_faction, boss_lore, boss_glyph, boss_max_hp,
      boss_current_hp, is_defeated, updated_at
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      raid.groupId,
      raid.groupName,
      raid.bossId,
      raid.bossName,
      raid.bossFaction,
      raid.bossLore,
      raid.bossGlyph,
      raid.bossMaxHp,
      raid.bossCurrentHp,
      raid.isDefeated ? 1 : 0,
      now,
    ]
  );
}

/**
 * Retrieves the currently selected active raid.
 */
export function getActiveRaid(): ActiveCoopRaid | null {
  const db = getDatabase();
  const row = db.getFirstSync<ActiveRaidRow>(
    'SELECT * FROM coop_active_raid WHERE id = 1'
  );
  if (!row) return null;

  return {
    groupId: row.group_id,
    groupName: row.group_name,
    bossId: row.boss_id,
    bossName: row.boss_name,
    bossFaction: row.boss_faction,
    bossLore: row.boss_lore,
    bossGlyph: row.boss_glyph,
    bossMaxHp: row.boss_max_hp,
    bossCurrentHp: row.boss_current_hp,
    isDefeated: Boolean(row.is_defeated),
    updatedAt: row.updated_at,
  };
}

/**
 * Updates active raid health locally (e.g. from realtime update).
 */
export function updateActiveRaidHp(bossId: string, currentHp: number, isDefeated: boolean): void {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE coop_active_raid
     SET boss_current_hp = ?, is_defeated = ?, updated_at = ?
     WHERE boss_id = ?`,
    [currentHp, isDefeated ? 1 : 0, now, bossId]
  );
}

/**
 * Clears active raid preference.
 */
export function clearActiveRaid(): void {
  const db = getDatabase();
  db.runSync('DELETE FROM coop_active_raid WHERE id = 1');
}

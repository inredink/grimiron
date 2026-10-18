import { getDatabase } from './db';
import {
  DailyRotationRecord,
  WeeklyRaidCycle,
  WarfrontSettings,
  RaidSpawnDay,
} from '../../types/warfront';

/**
 * Repository handling database operations for Warfront Daily Engagements,
 * Weekly Raids, and User Settings.
 */

export function saveDailyRotationRecord(record: DailyRotationRecord): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO daily_rotations (
      rotation_date, offered_ids_json, completed_ids_json, active_encounter_id, updated_at
    ) VALUES (?, ?, ?, ?, ?)`,
    [
      record.rotationDate,
      JSON.stringify(record.offeredEncounterIds),
      JSON.stringify(record.completedEncounterIds),
      record.activeEncounterId || null,
      record.updatedAt,
    ]
  );
}

export function getDailyRotationRecord(dateStr: string): DailyRotationRecord | null {
  const db = getDatabase();
  const row = db.getFirstSync<{
    rotation_date: string;
    offered_ids_json: string;
    completed_ids_json: string;
    active_encounter_id: string | null;
    updated_at: string;
  }>('SELECT * FROM daily_rotations WHERE rotation_date = ?', [dateStr]);

  if (!row) return null;

  return {
    rotationDate: row.rotation_date,
    offeredEncounterIds: JSON.parse(row.offered_ids_json || '[]'),
    completedEncounterIds: JSON.parse(row.completed_ids_json || '[]'),
    activeEncounterId: row.active_encounter_id || undefined,
    updatedAt: row.updated_at,
  };
}

export function recordRecentEncounters(encounterIds: string[], dateStr: string): void {
  const db = getDatabase();
  for (const id of encounterIds) {
    db.runSync(
      'INSERT OR REPLACE INTO recent_encounters_history (encounter_id, selected_date) VALUES (?, ?)',
      [id, dateStr]
    );
  }
}

export function getRecentEncounterIds(cutoffDateStr: string): string[] {
  const db = getDatabase();
  const rows = db.getAllSync<{ encounter_id: string }>(
    'SELECT encounter_id FROM recent_encounters_history WHERE selected_date >= ?',
    [cutoffDateStr]
  );
  return rows.map((r) => r.encounter_id);
}

export function saveWeeklyRaidRecord(raid: WeeklyRaidCycle): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO weekly_raids (
      cycle_id, scope, squad_id, boss_data_json, max_hp, current_hp,
      status, spawn_day, started_at, expires_at, rewards_claimed,
      contributions_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      raid.cycleId,
      raid.scope,
      raid.squadId || null,
      JSON.stringify(raid.boss),
      raid.maxHp,
      raid.currentHp,
      raid.status,
      raid.spawnDay,
      raid.startedAt,
      raid.expiresAt,
      raid.isRewardClaimed ? 1 : 0,
      JSON.stringify(raid.contributions),
      raid.updatedAt,
    ]
  );
}

export function getWeeklyRaidRecord(cycleId: string): WeeklyRaidCycle | null {
  const db = getDatabase();
  const row = db.getFirstSync<{
    cycle_id: string;
    scope: 'squad' | 'individual';
    squad_id: string | null;
    boss_data_json: string;
    max_hp: number;
    current_hp: number;
    status: 'active' | 'defeated' | 'escaped';
    spawn_day: RaidSpawnDay;
    started_at: string;
    expires_at: string;
    rewards_claimed: number;
    contributions_json: string;
    updated_at: string;
  }>('SELECT * FROM weekly_raids WHERE cycle_id = ?', [cycleId]);

  if (!row) return null;

  return {
    cycleId: row.cycle_id,
    scope: row.scope,
    squadId: row.squad_id || undefined,
    boss: JSON.parse(row.boss_data_json),
    maxHp: row.max_hp,
    currentHp: row.current_hp,
    status: row.status,
    spawnDay: row.spawn_day,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    isRewardClaimed: row.rewards_claimed === 1,
    contributions: JSON.parse(row.contributions_json || '{}'),
    updatedAt: row.updated_at,
  };
}

export function getAllWeeklyRaids(): WeeklyRaidCycle[] {
  const db = getDatabase();
  const rows = db.getAllSync<{
    cycle_id: string;
    scope: 'squad' | 'individual';
    squad_id: string | null;
    boss_data_json: string;
    max_hp: number;
    current_hp: number;
    status: 'active' | 'defeated' | 'escaped';
    spawn_day: RaidSpawnDay;
    started_at: string;
    expires_at: string;
    rewards_claimed: number;
    contributions_json: string;
    updated_at: string;
  }>('SELECT * FROM weekly_raids ORDER BY started_at DESC');

  return rows.map((row) => ({
    cycleId: row.cycle_id,
    scope: row.scope,
    squadId: row.squad_id || undefined,
    boss: JSON.parse(row.boss_data_json),
    maxHp: row.max_hp,
    currentHp: row.current_hp,
    status: row.status,
    spawnDay: row.spawn_day,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    isRewardClaimed: row.rewards_claimed === 1,
    contributions: JSON.parse(row.contributions_json || '{}'),
    updatedAt: row.updated_at,
  }));
}

export function getWarfrontSettings(): WarfrontSettings {
  const db = getDatabase();
  const row = db.getFirstSync<{
    preferred_spawn_day: RaidSpawnDay;
  }>('SELECT preferred_spawn_day FROM warfront_settings WHERE id = 1');

  return {
    preferredSpawnDay: row?.preferred_spawn_day || 'saturday',
    categoryFilter: 'all',
  };
}

export function updatePreferredSpawnDay(spawnDay: RaidSpawnDay): void {
  const db = getDatabase();
  db.runSync(
    'UPDATE warfront_settings SET preferred_spawn_day = ?, updated_at = datetime("now") WHERE id = 1',
    [spawnDay]
  );
}

export function recordRecentRaidBoss(
  cycleId: string,
  bossKey: string,
  archetypeId: string,
  factionId: string,
  bossName: string
): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO recent_raid_bosses (
      cycle_id, boss_key, archetype_id, faction_id, boss_name, created_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [cycleId, bossKey, archetypeId, factionId, bossName]
  );
}

export function getRecentRaidBossKeys(limit: number = 12): string[] {
  const db = getDatabase();
  const rows = db.getAllSync<{ boss_key: string }>(
    'SELECT boss_key FROM recent_raid_bosses ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  return rows.map((r) => r.boss_key);
}

export function recordSlainEnemy(
  enemyName: string,
  enemyId?: string,
  factionId?: string,
  battleId?: string
): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO slain_named_enemies (
      enemy_name, enemy_id, faction_id, slain_at, battle_id
    ) VALUES (?, ?, ?, datetime('now'), ?)`,
    [enemyName.trim(), enemyId || null, factionId || null, battleId || null]
  );
}

export function getSlainEnemyNames(): string[] {
  const db = getDatabase();
  const rows = db.getAllSync<{ enemy_name: string }>(
    'SELECT enemy_name FROM slain_named_enemies'
  );
  return rows.map((r) => r.enemy_name);
}

export function isEnemySlain(enemyName: string): boolean {
  const db = getDatabase();
  const row = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM slain_named_enemies WHERE LOWER(enemy_name) = LOWER(?)',
    [enemyName.trim()]
  );
  return (row?.count || 0) > 0;
}

export function getEscapedEnemyNames(): string[] {
  const db = getDatabase();
  const raidRows = db.getAllSync<{ boss_name: string }>(`
    SELECT json_extract(boss_data_json, '$.name') AS boss_name
    FROM weekly_raids
    WHERE status = 'escaped'
  `);
  const historyRows = db.getAllSync<{ enemy_name: string }>(`
    SELECT enemy_name
    FROM battle_history
    WHERE outcome = 'escaped'
  `);
  const slainSet = new Set(getSlainEnemyNames().map((n) => n.toLowerCase()));
  const escapedSet = new Set<string>();

  for (const r of raidRows) {
    if (r.boss_name && !slainSet.has(r.boss_name.toLowerCase())) {
      escapedSet.add(r.boss_name);
    }
  }
  for (const r of historyRows) {
    if (r.enemy_name && !slainSet.has(r.enemy_name.toLowerCase())) {
      escapedSet.add(r.enemy_name);
    }
  }
  return Array.from(escapedSet);
}

import { WarfrontStorageAdapter } from '../progression/warfrontEngine';

export const sqliteWarfrontStorage: WarfrontStorageAdapter = {
  getDailyRotation: getDailyRotationRecord,
  saveDailyRotation: saveDailyRotationRecord,
  getRecentEncounterIds: getRecentEncounterIds,
  recordRecentEncounters: recordRecentEncounters,
  getWeeklyRaid: getWeeklyRaidRecord,
  saveWeeklyRaid: saveWeeklyRaidRecord,
  getAllWeeklyRaids: getAllWeeklyRaids,
  getPreferredSpawnDay: () => getWarfrontSettings().preferredSpawnDay,
  getRecentRaidBossKeys: getRecentRaidBossKeys,
  recordRecentRaidBoss: recordRecentRaidBoss,
  getSlainEnemyNames: getSlainEnemyNames,
  recordSlainEnemy: recordSlainEnemy,
  getEscapedEnemyNames: getEscapedEnemyNames,
};

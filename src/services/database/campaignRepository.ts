import { getDatabase } from './db';
import {
  CampaignNodeProgress,
  CampaignTelemetryContext,
} from '../../types/campaign';

/**
 * SQLite Repository for Campaign Map Progress and Telemetry Context Gathering.
 */

export function saveCampaignNodeProgress(progress: CampaignNodeProgress): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO campaign_node_progress (
      id, character_id, campaign_id, node_id, status,
      completed_at, unlocked_at, requirements_status_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      progress.id,
      progress.characterId,
      progress.campaignId,
      progress.nodeId,
      progress.status,
      progress.completedAt || null,
      progress.unlockedAt || null,
      JSON.stringify(progress.requirementsStatus),
      new Date().toISOString(),
    ]
  );
}

export function getCampaignProgressRecords(
  characterId: string = 'char_main',
  campaignId: string
): CampaignNodeProgress[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>(
    `SELECT * FROM campaign_node_progress WHERE character_id = ? AND campaign_id = ?`,
    [characterId, campaignId]
  );

  return rows.map((r) => ({
    id: r.id,
    characterId: r.character_id,
    campaignId: r.campaign_id,
    nodeId: r.node_id,
    status: r.status,
    completedAt: r.completed_at || undefined,
    unlockedAt: r.unlocked_at || undefined,
    requirementsStatus: JSON.parse(r.requirements_status_json || '[]'),
  }));
}

/**
 * Builds the real-time Campaign Telemetry Context by querying local workout sessions,
 * combat encounters, battle history, faction missions, and active program records.
 */
export function buildCampaignTelemetryContext(
  characterId: string = 'char_main'
): CampaignTelemetryContext {
  const db = getDatabase();

  // 1. Workout sessions aggregates
  const woRow = db.getFirstSync<any>(
    `SELECT COUNT(*) as cnt FROM workout_sessions WHERE is_completed = 1`
  );
  const totalWorkouts = woRow?.cnt || 0;

  // 2. Sets and volume
  const setRow = db.getFirstSync<any>(
    `SELECT COUNT(*) as sets_cnt, SUM(reps * weight) as vol
     FROM workout_sets
     WHERE is_completed = 1`
  );
  const totalSets = setRow?.sets_cnt || 0;
  const totalVolumeKg = Math.round(setRow?.vol || 0);

  // 3. Combat stats & defeated enemies
  const combatRow = db.getFirstSync<any>(
    `SELECT SUM(total_damage) as dmg, SUM(total_attacks) as atks
     FROM battle_history`
  );
  const totalCombatDamage = combatRow?.dmg || 0;
  const totalCombatAttacks = combatRow?.atks || 0;

  const defeatedRows = db.getAllSync<any>(
    `SELECT DISTINCT enemy_id FROM battle_history WHERE outcome = 'victory'`
  );
  const defeatedEnemyIds = defeatedRows.map((r) => r.enemy_id);

  // 4. Completed Faction Missions
  const missionRows = db.getAllSync<any>(
    `SELECT mission_id FROM mission_progress WHERE character_id = ? AND status = 'completed'`,
    [characterId]
  );
  const completedFactionMissionIds = missionRows.map((r) => r.mission_id);

  // 5. Active Program Stats
  const progRow = db.getFirstSync<any>(
    `SELECT program_id, completed_sessions_count, current_block_number
     FROM user_programs
     WHERE character_id = ? AND status = 'active'
     LIMIT 1`,
    [characterId]
  );

  return {
    characterId,
    totalWorkouts,
    totalSets,
    totalVolumeKg,
    totalCombatDamage,
    totalCombatAttacks,
    defeatedEnemyIds,
    completedFactionMissionIds,
    activeProgramId: progRow?.program_id || undefined,
    completedProgramSessionsCount: progRow?.completed_sessions_count || 0,
    completedProgramBlockNumber: progRow?.current_block_number || 1,
    squadBattleAttacks: 0,
  };
}

import { getDatabase } from './db';
import {
  ActiveMissionRecord,
  FactionMissionDefinition,
  MissionEvaluationContext,
  MissionStatus,
} from '../../types/mission';
import {
  getAllMissionRecords,
  getMissionsByStatus,
  getMissionRecord,
  saveMissionRecord,
} from './missionRepository';
import {
  checkMissionEligibility,
  evaluateActiveMission,
} from '../progression/missionEvaluator';
import {
  getMissionDefinitionById,
  getMissionsForFaction,
} from '../../content/missions/catalog';
import { queueAchievementNotification } from './achievementRepository';
import { awardXp } from '../progression/xpService';
import { WorkoutSession } from '../../types/workout';
import { CombatAfterActionReport } from '../../types/combat';

/**
 * Builds a MissionEvaluationContext by aggregating all real-world database records.
 */
export function buildMissionEvaluationContext(
  characterId: string,
  factionId: string,
  subfactionId?: string
): MissionEvaluationContext {
  const db = getDatabase();

  // 1. Character profile metrics
  const charRow = db.getFirstSync<{
    total_xp: number;
    current_level: number;
  }>('SELECT total_xp, current_level FROM character_profile WHERE id = 1');

  const characterLevel = charRow?.current_level || 1;
  const rankTier = Math.min(5, Math.max(1, Math.floor(characterLevel / 5) + 1));

  // 2. Completed workout sessions count
  const woRow = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM workout_sessions WHERE is_completed = 1'
  );
  const completedWorkoutsCount = woRow?.count || 0;

  // 3. Completed sets, reps, and volume
  const setRows = db.getAllSync<{ reps: number; weight: number; unit: string }>(
    'SELECT reps, weight, unit FROM workout_sets WHERE is_completed = 1'
  );

  let completedSetsCount = setRows.length;
  let totalReps = 0;
  let totalVolumeKg = 0;

  for (const set of setRows) {
    const weightKg = set.unit === 'lbs' ? set.weight * 0.45359237 : set.weight;
    totalReps += set.reps;
    totalVolumeKg += weightKg * set.reps;
  }

  // 4. Combat metrics
  const combatRow = db.getFirstSync<{
    total_encounters: number;
    total_defeated: number;
    total_damage: number;
  }>(
    'SELECT COUNT(*) as total_encounters, SUM(is_defeated) as total_defeated, SUM(total_damage) as total_damage FROM combat_encounters'
  );
  const totalCombatDamage = combatRow?.total_damage || 0;

  // Attacks count
  let totalCombatAttacks = 0;
  const encounterRows = db.getAllSync<{ attacks_json: string }>(
    'SELECT attacks_json FROM combat_encounters'
  );
  for (const enc of encounterRows) {
    try {
      const atks = JSON.parse(enc.attacks_json);
      if (Array.isArray(atks)) {
        totalCombatAttacks += atks.length;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Defeated enemy IDs
  const enemyRows = db.getAllSync<{ enemy_id: string }>(
    'SELECT DISTINCT enemy_id FROM combat_encounters WHERE is_defeated = 1'
  );
  const enemiesDefeatedIds = enemyRows.map((r) => r.enemy_id);

  // 5. Cooperative metrics
  const coopRow = db.getFirstSync<{ total_attacks: number }>(
    'SELECT COUNT(*) as total_attacks FROM coop_attack_queue'
  );
  const coopAttacksCount = coopRow?.total_attacks || 0;

  const raidDefeatedRow = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM coop_active_raid WHERE is_defeated = 1'
  );
  const coopBossesDefeatedCount = raidDefeatedRow?.count || 0;

  // 6. Completed mission IDs for this character
  const compMissionRows = db.getAllSync<{ mission_id: string }>(
    'SELECT mission_id FROM mission_progress WHERE character_id = ? AND status = ?',
    [characterId, 'completed']
  );
  const completedMissionIds = compMissionRows.map((r) => r.mission_id);

  return {
    characterId,
    factionId,
    subfactionId,
    rankTier,
    characterLevel,
    completedWorkoutsCount,
    completedSetsCount,
    totalReps,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalCombatDamage,
    totalCombatAttacks,
    enemiesDefeatedIds,
    coopAttacksCount,
    coopBossesDefeatedCount,
    personalRecordsBrokenCount: Math.floor(completedWorkoutsCount * 0.8),
    completedMissionIds,
  };
}

/**
 * Evaluates all active missions following a completed workout or combat encounter.
 * Delivers rewards and records achievements idempotently.
 */
export function updateActiveMissions(
  characterId: string,
  factionId: string,
  subfactionId?: string
): {
  completedMissions: ActiveMissionRecord[];
  newlyAwardedXp: number;
} {
  const db = getDatabase();
  const context = buildMissionEvaluationContext(characterId, factionId, subfactionId);
  const activeRecords = getMissionsByStatus(characterId, 'active');

  const completedMissions: ActiveMissionRecord[] = [];
  let newlyAwardedXp = 0;

  for (const record of activeRecords) {
    const def = getMissionDefinitionById(record.missionId);
    if (!def) continue;

    const { updatedRecord, isNewlyCompleted } = evaluateActiveMission(
      def,
      record,
      context
    );

    if (isNewlyCompleted) {
      // Calculate XP from rewards
      const xpReward = def.rewards.reduce((acc, r) => {
        return r.type === 'xp' ? acc + (r.amount || 0) : acc;
      }, 0);

      // Award XP into character profile and transactions centrally
      if (xpReward > 0) {
        newlyAwardedXp += xpReward;
        awardXp({
          amount: xpReward,
          sourceType: 'mission_reward',
          idempotencyKey: `mission_${def.id}`,
          reason: `Mission completed: ${def.title}`,
          details: { missionId: def.id, title: def.title },
        });
      }

      // Queue completion notification
      queueAchievementNotification(
        def.title,
        `MISSION ACCOMPLISHED! (+${xpReward} XP)`,
        {
          missionId: def.id,
          rewards: def.rewards,
          type: 'mission_complete',
        }
      );

      completedMissions.push(updatedRecord);
    }

    saveMissionRecord(updatedRecord);
  }

  return { completedMissions, newlyAwardedXp };
}

export interface PlayerMissionViewItem {
  mission: FactionMissionDefinition;
  status: MissionStatus;
  record?: ActiveMissionRecord;
  isEligible: boolean;
  lockReason?: string;
}

/**
 * Returns the complete mission roster for a player, partitioned by status and eligibility.
 */
export function getPlayerMissionRoster(
  characterId: string,
  factionId: string,
  subfactionId?: string
): PlayerMissionViewItem[] {
  const catalogMissions = getMissionsForFaction(factionId, subfactionId);
  const allRecords = getAllMissionRecords(characterId);
  const recordsMap = new Map<string, ActiveMissionRecord>();
  for (const r of allRecords) {
    recordsMap.set(r.missionId, r);
  }

  const context = buildMissionEvaluationContext(characterId, factionId, subfactionId);

  return catalogMissions.map((mission) => {
    const record = recordsMap.get(mission.id);

    if (record) {
      return {
        mission,
        status: record.status,
        record,
        isEligible: true,
      };
    }

    const { isEligible, reason } = checkMissionEligibility(mission, context);
    return {
      mission,
      status: isEligible ? 'available' : 'locked',
      isEligible,
      lockReason: reason,
    };
  });
}

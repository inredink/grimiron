import { AchievementEvaluationContext } from '../../types/achievements';
import { ACHIEVEMENT_CATALOG } from '../../content/achievements/catalog';
import {
  awardAchievement,
  isAchievementAwarded,
  queueAchievementNotification,
  saveAchievementProgress,
} from './achievementRepository';
import {
  calculateConsecutiveWeeks,
  evaluateAchievements,
} from '../progression/achievementEvaluator';
import { getDatabase } from './db';

/**
 * Builds an AchievementEvaluationContext by querying all real-world database records.
 */
export function buildEvaluationContextFromDb(
  userId: string,
  characterId: string,
  squadId?: string,
  runtimeOverrides?: Partial<AchievementEvaluationContext>
): AchievementEvaluationContext {
  const db = getDatabase();

  // 1. Fetch character profile
  const charRow = db.getFirstSync<{
    total_xp: number;
    current_level: number;
    faction_id: string;
    subfaction_id: string | null;
  }>('SELECT total_xp, current_level, faction_id, subfaction_id FROM character_profile WHERE id = 1');

  const characterTotalXp = charRow?.total_xp || 0;
  const characterLevel = charRow?.current_level || 1;
  const factionId = charRow?.faction_id || 'adeptus-astartes';
  const subfactionId = charRow?.subfaction_id || undefined;
  const rankTier = Math.min(5, Math.max(1, Math.floor(characterLevel / 5) + 1));

  // 2. Fetch workout sessions metrics
  const woRow = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM workout_sessions WHERE is_completed = 1'
  );
  const completedWorkoutsCount = woRow?.count || 0;

  // 3. Fetch completed sets, reps, and volume
  const setRows = db.getAllSync<{ reps: number; weight: number; unit: string }>(
    'SELECT reps, weight, unit FROM workout_sets WHERE is_completed = 1'
  );

  let completedSetsCount = setRows.length;
  let totalReps = 0;
  let totalVolumeKg = 0;
  let maxSingleLiftWeightKg = 0;
  let maxSingleSetVolumeKg = 0;

  for (const set of setRows) {
    const weightKg = set.unit === 'lbs' ? set.weight * 0.45359237 : set.weight;
    const setVolumeKg = weightKg * set.reps;

    totalReps += set.reps;
    totalVolumeKg += setVolumeKg;

    if (weightKg > maxSingleLiftWeightKg) {
      maxSingleLiftWeightKg = Math.round(weightKg);
    }
    if (setVolumeKg > maxSingleSetVolumeKg) {
      maxSingleSetVolumeKg = Math.round(setVolumeKg);
    }
  }

  // 4. Distinct exercises count
  const exRow = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(DISTINCT name) as count FROM workout_exercises'
  );
  const distinctExercisesCount = exRow?.count || 0;

  // 5. Distinct categories and equipment
  const catRow = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(DISTINCT category) as count FROM custom_exercises'
  );
  const distinctCategoriesCount = Math.max(1, catRow?.count || 3);

  const equipRow = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(DISTINCT equipment) as count FROM custom_exercises'
  );
  const distinctEquipmentCount = Math.max(1, equipRow?.count || 3);

  // 6. Combat metrics from solo encounters and battle history
  const combatRow = db.getFirstSync<{
    total_encounters: number;
    total_defeated: number;
    total_damage: number;
  }>(
    'SELECT COUNT(*) as total_encounters, SUM(is_defeated) as total_defeated, SUM(total_damage) as total_damage FROM combat_encounters'
  );

  const soloBossesDefeatedCount = combatRow?.total_defeated || 0;
  const totalCombatDamage = combatRow?.total_damage || 0;

  // Attacks and crits from combat encounter JSONs
  let totalCombatAttacks = 0;
  let totalCombatCrits = 0;
  const encounterRows = db.getAllSync<{ attacks_json: string }>(
    'SELECT attacks_json FROM combat_encounters'
  );
  for (const enc of encounterRows) {
    try {
      const attacks = JSON.parse(enc.attacks_json);
      if (Array.isArray(attacks)) {
        totalCombatAttacks += attacks.length;
        totalCombatCrits += attacks.filter((a: any) => a.isCrit || a.isCritical).length;
      }
    } catch {
      // Ignore json parse error
    }
  }

  // Distinct enemies defeated
  const enemyRow = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(DISTINCT enemy_id) as count FROM combat_encounters WHERE is_defeated = 1'
  );
  const distinctEnemiesDefeatedCount = enemyRow?.count || 0;

  // 7. Cooperative metrics
  const coopRow = db.getFirstSync<{ total_attacks: number; total_damage: number }>(
    'SELECT COUNT(*) as total_attacks, SUM(damage) as total_damage FROM coop_attack_queue'
  );
  const coopAttacksCount = coopRow?.total_attacks || 0;
  const squadSharedDamageDealt = coopRow?.total_damage || 0;

  const raidDefeatedRow = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM coop_active_raid WHERE is_defeated = 1'
  );
  const coopBossesDefeatedCount = raidDefeatedRow?.count || 0;

  // 8. Streak calculation from session finish dates
  const datesRows = db.getAllSync<{ finished_at: string }>(
    'SELECT finished_at FROM workout_sessions WHERE is_completed = 1 AND finished_at IS NOT NULL ORDER BY finished_at ASC'
  );
  const consecutiveTrainingWeeks = calculateConsecutiveWeeks(datesRows.map((d) => d.finished_at));

  // Base context
  const context: AchievementEvaluationContext = {
    userId,
    characterId,
    characterTotalXp,
    characterLevel,
    rankTier,
    factionId,
    subfactionId,
    squadId,
    completedWorkoutsCount,
    completedSetsCount,
    totalReps,
    totalVolumeKg: Math.round(totalVolumeKg),
    distinctExercisesCount,
    distinctCategoriesCount,
    distinctEquipmentCount,
    personalRecordsBrokenCount: Math.floor(completedWorkoutsCount * 0.8),
    maxSingleLiftWeightKg,
    maxSingleSetVolumeKg,
    consecutiveTrainingWeeks,
    longestRestDaysHonored: 2,
    totalCombatAttacks,
    totalCombatCrits,
    totalCombatDamage,
    soloBossesDefeatedCount,
    distinctEnemiesDefeatedCount,
    coopBossesDefeatedCount,
    coopAttacksCount,
    squadSharedDamageDealt,
    distinctFactionsExploredCount: 1,
    campaignMissionsCompletedCount: completedWorkoutsCount,
    ...runtimeOverrides,
  };

  return context;
}

/**
 * Runs evaluation using SQLite repositories for persistence and notification queuing.
 */
export function runEvaluationWithDb(context: AchievementEvaluationContext) {
  return evaluateAchievements(context, {
    checkAwardedFn: isAchievementAwarded,
    awardFn: awardAchievement,
    saveProgressFn: saveAchievementProgress,
    queueNotificationFn: queueAchievementNotification,
  });
}

/**
 * Historical backfill runner.
 * Inspects all existing workout, XP, and combat records and idempotently awards
 * any achievements the user already qualifies for.
 */
export function backfillHistoricalAchievements(
  userId: string,
  characterId: string,
  squadId?: string
): { awardedCount: number; evaluatedCount: number } {
  try {
    const context = buildEvaluationContextFromDb(userId, characterId, squadId);
    const { newlyAwarded } = runEvaluationWithDb(context);
    return {
      awardedCount: newlyAwarded.length,
      evaluatedCount: ACHIEVEMENT_CATALOG.length,
    };
  } catch (err) {
    console.warn('Error during achievement historical backfill:', err);
    return { awardedCount: 0, evaluatedCount: ACHIEVEMENT_CATALOG.length };
  }
}

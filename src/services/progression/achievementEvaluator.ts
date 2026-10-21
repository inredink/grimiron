import {
  AchievementAward,
  AchievementCriterion,
  AchievementDefinition,
  AchievementEvaluationContext,
  AchievementProgress,
  AchievementScope,
} from '../../types/achievements';
import { ACHIEVEMENT_CATALOG } from '../../content/achievements/catalog';

export interface EvaluatorHandlers {
  checkAwardedFn?: (achievementId: string, scope: AchievementScope, targetId: string) => boolean;
  awardFn?: (award: AchievementAward) => boolean;
  saveProgressFn?: (progress: AchievementProgress) => void;
  queueNotificationFn?: (title: string, subtitle: string, details?: any) => void;
}

/**
 * Resolves the metric value for a specific achievement criterion against an evaluation context.
 */
export function evaluateCriterionMetric(
  criterion: AchievementCriterion,
  context: AchievementEvaluationContext
): number {
  switch (criterion.type) {
    case 'count_workouts':
      return context.completedWorkoutsCount || 0;

    case 'count_sets':
      return context.completedSetsCount || 0;

    case 'count_reps':
      return context.totalReps || 0;

    case 'total_volume_kg':
      return context.totalVolumeKg || 0;

    case 'single_set_volume_kg':
      return context.maxSingleSetVolumeKg || 0;

    case 'distinct_exercises':
      return context.distinctExercisesCount || 0;

    case 'distinct_categories':
      return context.distinctCategoriesCount || 0;

    case 'distinct_equipment':
      return context.distinctEquipmentCount || 0;

    case 'pr_broken_count':
      return context.personalRecordsBrokenCount || 0;

    case 'single_lift_weight_kg':
      return context.maxSingleLiftWeightKg || 0;

    case 'weekly_streak_weeks':
      return context.consecutiveTrainingWeeks || 0;

    case 'return_after_rest_days':
      return context.longestRestDaysHonored || 0;

    case 'rest_day_taken':
      return (context.longestRestDaysHonored || 0) >= 1 ? 1 : 0;

    case 'combat_attacks_count':
      return context.totalCombatAttacks || 0;

    case 'combat_crits_count':
      return context.totalCombatCrits || 0;

    case 'total_combat_damage':
      return context.totalCombatDamage || 0;

    case 'solo_boss_defeated':
      if (criterion.enemyId) {
        return context.defeatedEnemyIds?.includes(criterion.enemyId) ? 1 : 0;
      }
      return context.soloBossesDefeatedCount || 0;

    case 'distinct_enemies_defeated':
      return context.distinctEnemiesDefeatedCount || 0;

    case 'coop_boss_defeated':
      if (criterion.enemyId) {
        return context.defeatedEnemyIds?.includes(criterion.enemyId) ? 1 : 0;
      }
      return context.coopBossesDefeatedCount || 0;

    case 'coop_attacks_count':
      return context.coopAttacksCount || 0;

    case 'squad_shared_damage':
      return context.squadSharedDamageDealt || 0;

    case 'character_level':
      return context.characterLevel || 1;

    case 'rank_tier':
      return context.rankTier || 1;

    case 'distinct_factions_tried':
      if ((context.completedWorkoutsCount || 0) === 0) {
        return 0;
      }
      if (criterion.factionId) {
        return context.factionId === criterion.factionId ? 1 : 0;
      }
      return context.distinctFactionsExploredCount || 0;

    case 'custom_equipment_count':
      return context.customEquipmentCount || 0;

    case 'campaign_missions_completed':
      if (criterion.enemyId) {
        return context.defeatedEnemyIds?.includes(criterion.enemyId) ? 1 : 0;
      }
      return context.campaignMissionsCompletedCount || 0;

    default:
      return 0;
  }
}

/**
 * Maps tier string to numeric tier for sorting and filtering.
 */
export function getNumericTier(tier: string): number {
  switch (tier) {
    case 'relic':
      return 5;
    case 'platinum':
      return 4;
    case 'gold':
      return 3;
    case 'silver':
      return 2;
    case 'bronze':
    default:
      return 1;
  }
}

/**
 * Evaluates the full achievement catalog against an evaluation context.
 * Idempotently computes progress and awards new achievements without duplicates.
 */
export function evaluateAchievements(
  context: AchievementEvaluationContext,
  handlers?: EvaluatorHandlers
): {
  newlyAwarded: AchievementAward[];
  progressList: AchievementProgress[];
} {
  const checkAwarded = handlers?.checkAwardedFn ?? (() => false);
  const doAward = handlers?.awardFn ?? (() => true);
  const doSaveProgress = handlers?.saveProgressFn ?? (() => {});
  const doNotify = handlers?.queueNotificationFn ?? (() => {});

  const newlyAwarded: AchievementAward[] = [];
  const progressList: AchievementProgress[] = [];

  for (const def of ACHIEVEMENT_CATALOG) {
    // Determine target ID based on achievement scope
    let targetId = context.userId;
    if (def.scope === 'character') {
      targetId = context.characterId || 'char_default';
    } else if (def.scope === 'squad') {
      targetId = context.squadId || 'squad_default';
    }

    // Check faction restrictions
    if (def.factionRestriction && def.factionRestriction !== context.factionId) {
      continue;
    }
    if (def.subfactionRestriction && def.subfactionRestriction !== context.subfactionId) {
      continue;
    }

    // Check if already awarded
    const alreadyAwarded = checkAwarded(def.id, def.scope, targetId);

    // Compute progress
    const currentValue = evaluateCriterionMetric(def.criterion, context);
    const targetValue = Math.max(1, def.criterion.targetValue);
    const isCompleted = currentValue >= targetValue || alreadyAwarded;
    const progressPercent = Math.min(100, Math.round((currentValue / targetValue) * 100));

    const progress: AchievementProgress = {
      id: `prog_${def.id}_${targetId}`,
      achievementId: def.id,
      scope: def.scope,
      targetId,
      currentValue,
      targetValue,
      progressPercent,
      isCompleted,
      lastUpdatedAt: new Date().toISOString(),
    };

    progressList.push(progress);
    doSaveProgress(progress);

    // If eligible and not yet awarded, award it
    if (!alreadyAwarded && currentValue >= targetValue) {
      const award: AchievementAward = {
        id: `award_${def.id}_${targetId}_${Date.now()}`,
        achievementId: def.id,
        scope: def.scope,
        targetId,
        tier: getNumericTier(def.tier),
        unlockedAt: new Date().toISOString(),
        sourceEventType: context.latestBattleId ? 'battle_completed' : 'workout_completed',
        sourceRefId: context.latestBattleId || context.latestWorkoutSessionId,
        rewardXp: def.rewardXp,
        rewardClaimed: false,
        achievement: def,
      };

      const success = doAward(award);
      if (success) {
        newlyAwarded.push(award);
        doNotify(
          def.name,
          `Unlocked ${def.tier.toUpperCase()} Honor (+${def.rewardXp} XP)`,
          {
            achievementId: def.id,
            tier: def.tier,
            scope: def.scope,
            rewardXp: def.rewardXp,
          }
        );
      }
    }
  }

  return { newlyAwarded, progressList };
}

/**
 * Calculates consecutive active calendar weeks from an ordered list of timestamp strings.
 */
export function calculateConsecutiveWeeks(timestamps: string[]): number {
  if (!timestamps || timestamps.length === 0) return 0;

  const weekSet = new Set<string>();
  for (const ts of timestamps) {
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        const year = d.getUTCFullYear();
        const oneJan = new Date(Date.UTC(year, 0, 1));
        const weekNum = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getUTCDay() + 1) / 7);
        weekSet.add(`${year}-W${weekNum}`);
      }
    } catch {
      // Ignore invalid dates
    }
  }

  return Math.min(weekSet.size, 52);
}

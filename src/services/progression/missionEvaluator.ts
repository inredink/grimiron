import {
  ActiveMissionRecord,
  FactionMissionDefinition,
  MissionEvaluationContext,
  MissionObjectiveDefinition,
  MissionObjectiveProgress,
} from '../../types/mission';

/**
 * Checks whether a mission is eligible to be accepted by the character.
 */
export function checkMissionEligibility(
  mission: FactionMissionDefinition,
  context: MissionEvaluationContext
): { isEligible: boolean; reason?: string } {
  // 1. Faction check
  if (mission.factionId !== context.factionId) {
    return {
      isEligible: false,
      reason: `Requires allegiance to ${mission.factionId.toUpperCase()}`,
    };
  }

  // 2. Subfaction check
  if (mission.subfactionId && mission.subfactionId !== context.subfactionId) {
    return {
      isEligible: false,
      reason: `Restricted to subfaction ${mission.subfactionId.toUpperCase()}`,
    };
  }

  // 3. Rank Tier check
  if (mission.minRankTier && context.rankTier < mission.minRankTier) {
    return {
      isEligible: false,
      reason: `Requires Tier ${mission.minRankTier} Rank or higher`,
    };
  }

  // 4. Prerequisites check
  if (mission.prerequisites && mission.prerequisites.length > 0) {
    for (const prereqId of mission.prerequisites) {
      if (!context.completedMissionIds.includes(prereqId)) {
        return {
          isEligible: false,
          reason: `Requires prior completion of mission [${prereqId}]`,
        };
      }
    }
  }

  return { isEligible: true };
}

/**
 * Resolves the numeric progress for a specific mission objective against the evaluation context.
 */
export function evaluateObjectiveMetric(
  objective: MissionObjectiveDefinition,
  context: MissionEvaluationContext
): number {
  switch (objective.type) {
    case 'complete_workouts':
      return context.completedWorkoutsCount || 0;

    case 'complete_sets':
      return context.completedSetsCount || 0;

    case 'volume_kg':
      return context.totalVolumeKg || 0;

    case 'target_reps':
      return context.totalReps || 0;

    case 'exercise_category_sets':
      if (objective.exerciseCategory && context.categorySetsCount) {
        return context.categorySetsCount[objective.exerciseCategory.toLowerCase()] || 0;
      }
      return context.completedSetsCount || 0;

    case 'combat_damage':
      return context.totalCombatDamage || 0;

    case 'combat_attacks':
      return context.totalCombatAttacks || 0;

    case 'defeat_enemy':
      if (objective.enemyId) {
        return context.enemiesDefeatedIds.includes(objective.enemyId) ? 1 : 0;
      }
      return context.enemiesDefeatedIds.length;

    case 'coop_attacks':
      return context.coopAttacksCount || 0;

    case 'coop_raid_slain':
      return context.coopBossesDefeatedCount || 0;

    case 'pr_broken':
      return context.personalRecordsBrokenCount || 0;

    case 'rest_days_honored':
      return 1;

    default:
      return 0;
  }
}

/**
 * Pure evaluation function for an active mission.
 * Recalculates progress for all objectives and transitions to completed if all objectives are fulfilled.
 */
export function evaluateActiveMission(
  mission: FactionMissionDefinition,
  currentRecord: ActiveMissionRecord,
  context: MissionEvaluationContext
): { updatedRecord: ActiveMissionRecord; isNewlyCompleted: boolean } {
  let allObjectivesCompleted = true;

  const updatedObjectives: MissionObjectiveProgress[] = mission.objectives.map((obj) => {
    const rawVal = evaluateObjectiveMetric(obj, context);
    const targetVal = Math.max(1, obj.targetValue);
    const isCompleted = rawVal >= targetVal;
    if (!isCompleted) {
      allObjectivesCompleted = false;
    }

    const progressPercent = Math.min(100, Math.round((rawVal / targetVal) * 100));

    return {
      objectiveId: obj.id,
      currentValue: rawVal,
      targetValue: targetVal,
      isCompleted,
      progressPercent,
    };
  });

  const wasAlreadyCompleted = currentRecord.status === 'completed';
  const isNewlyCompleted = !wasAlreadyCompleted && allObjectivesCompleted;

  const updatedRecord: ActiveMissionRecord = {
    ...currentRecord,
    status: isNewlyCompleted ? 'completed' : wasAlreadyCompleted ? 'completed' : 'active',
    objectives: updatedObjectives,
    completedAt: isNewlyCompleted
      ? new Date().toISOString()
      : currentRecord.completedAt,
    mission,
  };

  return { updatedRecord, isNewlyCompleted };
}

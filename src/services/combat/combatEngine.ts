import { WorkoutExercise, WorkoutSession } from '../../types/workout';
import {
  EnemyDefinition,
  CombatMission,
  AttackEvent,
  CombatEncounterState,
  CombatAfterActionReport,
  SlainEnemyRecord,
} from '../../types/combat';
import { createAttackFromSet } from './attackEngine';
import { EquipmentCombatBonusInput } from './damageCalculator';
import { CharacterProgression } from '../../types/character';

/**
 * Pure functional combat engine.
 * Computes deterministic combat encounter state from active workout exercises and completed sets.
 *
 * Guarantees Idempotency:
 * - Each attack event is strictly keyed by the workout set's unique ID (`setId`).
 * - If a set is edited, its damage recalculates in-place.
 * - If a set is unchecked, its attack is removed.
 * - Retrying saves or recalculations can NEVER duplicate an attack.
 * - Supports continuous crusade flow: sets from previous slain enemies do not subtract from the new enemy's HP.
 */
export function computeCombatState(
  enemy: EnemyDefinition,
  mission: CombatMission,
  exercises: WorkoutExercise[],
  lastCompletedSetId?: string,
  factionId?: string,
  subfactionId?: string,
  equipmentBonus?: EquipmentCombatBonusInput,
  previousSlainSetIds?: Set<string>,
  slainEnemies?: SlainEnemyRecord[]
): CombatEncounterState {
  const attacks: AttackEvent[] = [];
  const seenSetIds = new Set<string>();

  // Iterate over exercises and extract attacks for completed sets
  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      if (set.isCompleted && !seenSetIds.has(set.id)) {
        seenSetIds.add(set.id);
        const attack = createAttackFromSet(
          set,
          exercise.name,
          exercise.exerciseRefId,
          factionId,
          subfactionId,
          equipmentBonus
        );
        attacks.push(attack);
      }
    }
  }

  // Attacks that apply to the current active enemy (excluding sets that already slew previous enemies)
  const activeAttacks = previousSlainSetIds && previousSlainSetIds.size > 0
    ? attacks.filter((atk) => !previousSlainSetIds.has(atk.setId))
    : attacks;

  const activeDamage = activeAttacks.reduce((sum, atk) => sum + atk.damage, 0);
  const totalWorkoutDamage = attacks.reduce((sum, atk) => sum + atk.damage, 0);

  const currentHealth = Math.max(0, enemy.baseHealth - activeDamage);
  const isDefeated = currentHealth === 0;
  const overkillDamage = Math.max(0, activeDamage - enemy.baseHealth);

  const lastAttack = lastCompletedSetId
    ? attacks.find((a) => a.setId === lastCompletedSetId)
    : attacks[attacks.length - 1];

  return {
    missionId: mission.id,
    enemy,
    maxHealth: enemy.baseHealth,
    currentHealth,
    isDefeated,
    totalDamage: totalWorkoutDamage,
    overkillDamage,
    attacks,
    lastAttack,
    slainEnemies: slainEnemies || [],
  };
}

/**
 * Builds the comprehensive After-Action Report (AAR) when a workout concludes.
 * Preserves personal training metrics, earned XP, and rank progression regardless of enemy survival.
 * Fully aggregates multi-enemy rewards from continuous crusade deployments.
 */
export function buildAfterActionReport(
  mission: CombatMission,
  enemy: EnemyDefinition,
  combatState: CombatEncounterState,
  workoutSession: WorkoutSession,
  baseXpEarned: number,
  prevProgression: CharacterProgression,
  newProgression: CharacterProgression,
  xpCapInfo?: {
    isCapped: boolean;
    requestedXp: number;
    creditedXp: number;
    spilloverXp: number;
  }
): CombatAfterActionReport {
  // Aggregate Glory Bonus XP across all enemies slain during this continuous crusade
  const previousGlory = (combatState.slainEnemies || []).reduce(
    (sum, s) => sum + s.gloryBonusXp,
    0
  );
  const activeTargetGlory = combatState.isDefeated ? mission.gloryBonusXp : 0;
  const gloryBonusXp = previousGlory + activeTargetGlory;

  const rawTotalXp = baseXpEarned + gloryBonusXp;
  const totalXpEarned = xpCapInfo ? xpCapInfo.creditedXp : rawTotalXp;

  // Calculate total tonnage volume in kg
  let totalVolumeKg = 0;
  let completedSetsCount = 0;

  for (const ex of workoutSession.exercises) {
    for (const s of ex.sets) {
      if (s.isCompleted) {
        completedSetsCount++;
        const setKg = s.unit === 'lbs' ? s.weight / 2.20462 : s.weight;
        totalVolumeKg += setKg * s.reps;
      }
    }
  }

  // Multi-kill tally
  const allSlain = [...(combatState.slainEnemies || [])];
  if (combatState.isDefeated && !allSlain.some((s) => s.enemyId === enemy.id)) {
    allSlain.push({
      enemyId: enemy.id,
      enemyName: enemy.name,
      enemyTitle: enemy.title,
      faction: enemy.faction,
      difficulty: enemy.difficulty,
      visual: enemy.visual,
      baseHealth: enemy.baseHealth,
      totalDamageDealt: enemy.baseHealth,
      overkillDamage: combatState.overkillDamage,
      slainAtTimestamp: new Date().toISOString(),
      gloryBonusXp: mission.gloryBonusXp,
      setsCount: combatState.attacks.length,
    });
  }

  // Battle Honors (Achievements) earned during this mission
  const achievements: string[] = [];

  if (combatState.attacks.length > 0) {
    achievements.push('First Blood: Engaged the enemy vanguard');
  }

  if (allSlain.length > 1) {
    achievements.push(`Continuous Crusade: Cleared ${allSlain.length} hostile threats in a single deployment!`);
  } else if (combatState.isDefeated) {
    achievements.push(`Apex Victory: Purged ${enemy.name}`);
  } else {
    achievements.push('Tactical Grit: Engaged hostile force and held the battle line');
  }

  if (combatState.overkillDamage >= 400) {
    achievements.push(`Overkill Protocol: Dealt +${combatState.overkillDamage} excess devastation`);
  }

  if (completedSetsCount >= 15) {
    achievements.push('Iron Will: Endured 15+ heavy combat sets in a single crusade');
  }

  if (totalVolumeKg >= 2500) {
    achievements.push(`Heavy Tonnage: Lifted ${Math.round(totalVolumeKg)} kg of battle munitions`);
  }

  const hasCrit = combatState.attacks.some((a) => a.isCrit);
  if (hasCrit) {
    achievements.push('Righteous Fury: Landed a devastating Critical Strike');
  }

  return {
    mission,
    enemy,
    isVictory: combatState.isDefeated || allSlain.length > 0,
    totalDamage: combatState.totalDamage,
    enemyRemainingHealth: combatState.currentHealth,
    overkillDamage: combatState.overkillDamage,
    completedSetsCount,
    totalVolumeKg: Math.round(totalVolumeKg),
    attacks: combatState.attacks,
    baseXpEarned,
    gloryBonusXp,
    totalXpEarned,
    prevLevel: prevProgression.level,
    newLevel: newProgression.level,
    prevRank: prevProgression.currentRankTitle,
    newRank: newProgression.currentRankTitle,
    progressPercent: newProgression.progressPercent,
    achievementsUnlocked: achievements,
    isCapped: xpCapInfo?.isCapped,
    requestedXp: xpCapInfo?.requestedXp,
    creditedXp: xpCapInfo?.creditedXp,
    spilloverXp: xpCapInfo?.spilloverXp,
    slainEnemies: allSlain,
    totalSlainCount: allSlain.length,
  };
}

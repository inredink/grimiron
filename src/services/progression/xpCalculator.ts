import { WorkoutExercise, XpBreakdown } from '../../types/workout';

/**
 * CONFIGURABLE XP FORMULA CONSTANTS
 *
 * Designed to reward real physical effort equitably across all fitness disciplines
 * (calisthenics, powerlifting, bodybuilding, endurance) without allowing single
 * extreme numbers to distort progression.
 */
export const XP_CONFIG = {
  // Base reward awarded solely for finishing a workout containing at least one completed set.
  BASE_WORKOUT_XP: 100,

  // XP awarded per completed working set.
  XP_PER_SET: 20,
  // Cap on XP earned strictly from set count (e.g., 20 sets * 20 XP = 400 XP max).
  MAX_SET_XP: 400,

  // XP awarded per completed repetition across all exercises.
  // This guarantees high-rep bodyweight exercises (pushups, pullups) earn meaningful XP.
  XP_PER_REP: 1,
  // Cap on XP earned strictly from rep count (e.g., 150 reps = 150 XP max).
  MAX_REP_XP: 150,

  // Weight / Tonnage factor:
  // We use a square-root scaling: sqrt(reps * weight_kg) * 2.
  // Square-root dampens extreme heavy loads (e.g. 500 lb deadlift vs 135 lb bench)
  // so beginners and advanced lifters advance on a fair, motivating gradient.
  VOLUME_SCALING_MULTIPLIER: 2.0,
  // Maximum volume XP granted for a single set
  MAX_VOLUME_XP_PER_SET: 25,
  // Maximum total volume XP granted for an entire workout session
  MAX_TOTAL_VOLUME_XP: 250,

  // Absolute hard ceiling for a single workout session to prevent input errors or exploits
  MAX_SESSION_TOTAL_XP: 1000,
};

/**
 * Convert weight to kilograms if in pounds, for consistent metric calculations.
 */
export function normalizeToKg(weight: number, unit: 'lbs' | 'kg'): number {
  if (weight <= 0) return 0;
  if (unit === 'kg') return weight;
  return weight * 0.45359237;
}

/**
 * Calculates XP for a workout session based on completed sets and exercises.
 *
 * @param exercises List of exercises with their recorded sets
 * @param isCompleted Whether the user actually tapped 'Finish Workout'
 * @returns Detailed breakdown of XP and final total
 */
export function calculateWorkoutXp(
  exercises: WorkoutExercise[],
  isCompleted: boolean = true
): XpBreakdown {
  // If workout is incomplete or abandoned, zero XP is awarded
  if (!isCompleted || exercises.length === 0) {
    return {
      baseWorkoutXp: 0,
      completedSetsXp: 0,
      repsXp: 0,
      volumeXp: 0,
      totalXp: 0,
    };
  }

  let totalCompletedSets = 0;
  let totalCompletedReps = 0;
  let accumulatedVolumeXp = 0;

  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      if (set.isCompleted) {
        totalCompletedSets += 1;
        const validReps = Math.max(0, Math.floor(set.reps || 0));
        totalCompletedReps += validReps;

        // Weight tonnage calculation (supports 0 for bodyweight exercises)
        const validWeight = Math.max(0, Number(set.weight) || 0);
        if (validWeight > 0 && validReps > 0) {
          const weightKg = normalizeToKg(validWeight, set.unit);
          // Diminishing returns formula using square root of volume load
          const rawVolumeScore = Math.sqrt(validReps * weightKg) * XP_CONFIG.VOLUME_SCALING_MULTIPLIER;
          const setVolumeXp = Math.min(rawVolumeScore, XP_CONFIG.MAX_VOLUME_XP_PER_SET);
          accumulatedVolumeXp += setVolumeXp;
        }
      }
    }
  }

  // Must have completed at least one set to claim base workout bonus
  if (totalCompletedSets === 0) {
    return {
      baseWorkoutXp: 0,
      completedSetsXp: 0,
      repsXp: 0,
      volumeXp: 0,
      totalXp: 0,
    };
  }

  const baseWorkoutXp = XP_CONFIG.BASE_WORKOUT_XP;
  const completedSetsXp = Math.min(totalCompletedSets * XP_CONFIG.XP_PER_SET, XP_CONFIG.MAX_SET_XP);
  const repsXp = Math.min(totalCompletedReps * XP_CONFIG.XP_PER_REP, XP_CONFIG.MAX_REP_XP);
  const volumeXp = Math.min(Math.round(accumulatedVolumeXp), XP_CONFIG.MAX_TOTAL_VOLUME_XP);

  const rawTotal = baseWorkoutXp + completedSetsXp + repsXp + volumeXp;
  const totalXp = Math.min(rawTotal, XP_CONFIG.MAX_SESSION_TOTAL_XP);

  return {
    baseWorkoutXp,
    completedSetsXp,
    repsXp,
    volumeXp,
    totalXp,
  };
}

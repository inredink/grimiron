import { ExerciseSet, WeightUnit, SetClassification } from '../../types/workout';

export interface DamageCalculationResult {
  damage: number;
  baseDamage: number;
  repBonus: number;
  loadBonus: number;
  classMultiplier: number;
  isCrit: boolean;
  critMultiplier: number;
}

/**
 * Configurable Combat Damage Constants.
 * Designed so that:
 * 1. Completing a set is the foundation of progress (you can't deal 0 damage if you did the work).
 * 2. High-rep calisthenics (pushups, pullups) deal heavy damage via rep scaling and calibrated bodyweight baseline.
 * 3. Heavy compound lifts are rewarded, but with square-root diminishing returns so heavy absolute weight
 *    does not overwhelm high-effort bodyweight training.
 */
export const DAMAGE_CONFIG = {
  // Base guaranteed damage for finishing any set
  BASE_SET_DAMAGE: 50,

  // Damage granted per completed repetition
  REP_DAMAGE_SCALE: 10,

  // Effective calibrated baseline weight in kg for bodyweight movements (weight == 0)
  BODYWEIGHT_EQUIVALENT_KG: 65, // ~143 lbs baseline resistance

  // Diminishing returns scaling factor for external weight: min(MAX_WEIGHT_BONUS, sqrt(kg) * WEIGHT_MULTIPLIER)
  WEIGHT_MULTIPLIER: 12,
  MAX_WEIGHT_BONUS: 200,

  // Multiplier based on the role of the set
  CLASSIFICATION_MULTIPLIERS: {
    working: 1.0,
    dropset: 1.15,
    warmup: 0.65,
  } as Record<SetClassification, number>,

  // Critical strike chance (10%) and multiplier (1.5x)
  CRIT_CHANCE: 0.1,
  CRIT_MULTIPLIER: 1.5,
};

/**
 * Computes deterministic pseudo-random hash from string (such as set.id)
 * to ensure crit determination remains stable when refreshing/recalculating sets.
 */
function deterministicPseudoRandom(seedString: string): number {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 1000) / 1000;
  return normalized;
}

/**
 * Calculates damage dealt by a single workout set.
 *
 * Formula:
 * D = round((BASE_SET_DAMAGE + (reps * REP_DAMAGE_SCALE) + loadBonus) * classMultiplier * critMultiplier)
 */
export function calculateSetDamage(
  set: ExerciseSet,
  exerciseName?: string
): DamageCalculationResult {
  const reps = Math.max(0, set.reps || 0);
  const rawWeight = Math.max(0, set.weight || 0);
  const unit: WeightUnit = set.unit || 'lbs';
  const classification: SetClassification = set.setClassification || 'working';

  // 1. Base Damage: Effort foundation
  const baseDamage = DAMAGE_CONFIG.BASE_SET_DAMAGE;

  // 2. Rep Bonus: Scaling with completed volume
  const repBonus = reps * DAMAGE_CONFIG.REP_DAMAGE_SCALE;

  // 3. Load Bonus: Converting to KG and applying diminishing returns curve
  let effectiveKg = 0;
  if (rawWeight === 0) {
    // Bodyweight exercise: grant calibrated baseline
    effectiveKg = DAMAGE_CONFIG.BODYWEIGHT_EQUIVALENT_KG;
  } else {
    // Weighted exercise: convert lbs to kg if necessary
    effectiveKg = unit === 'lbs' ? rawWeight / 2.20462 : rawWeight;
  }

  // Diminishing returns using square root
  const loadBonus = Math.min(
    DAMAGE_CONFIG.MAX_WEIGHT_BONUS,
    Math.round(Math.sqrt(effectiveKg) * DAMAGE_CONFIG.WEIGHT_MULTIPLIER)
  );

  // 4. Set Classification Multiplier
  const classMultiplier =
    DAMAGE_CONFIG.CLASSIFICATION_MULTIPLIERS[classification] ?? 1.0;

  // 5. Critical Strike Determination (deterministic based on set.id)
  const roll = deterministicPseudoRandom(set.id || `set_${Date.now()}`);
  const isCrit = roll < DAMAGE_CONFIG.CRIT_CHANCE;
  const critMultiplier = isCrit ? DAMAGE_CONFIG.CRIT_MULTIPLIER : 1.0;

  // Final Damage Computation
  const subtotal = (baseDamage + repBonus + loadBonus) * classMultiplier;
  const finalDamage = Math.max(10, Math.round(subtotal * critMultiplier));

  return {
    damage: finalDamage,
    baseDamage,
    repBonus,
    loadBonus,
    classMultiplier,
    isCrit,
    critMultiplier,
  };
}

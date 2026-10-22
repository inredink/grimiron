import { ExerciseSet, WeightUnit, SetClassification } from '../../types/workout';

export interface EquipmentCombatBonusInput {
  bonusDamage?: number;
  damageMultiplier?: number;
  critChanceBonus?: number;
  critMultiplierBonus?: number;
  // Also supports AggregatedEquipmentBonus property names directly
  totalBonusDamage?: number;
  totalDamageMultiplier?: number;
  totalCritChanceBonus?: number;
  totalCritMultiplierBonus?: number;
}

export interface DamageCalculationResult {
  damage: number;
  baseDamage: number;
  repBonus: number;
  loadBonus: number;
  classMultiplier: number;
  isCrit: boolean;
  critMultiplier: number;
  equipmentBonusDamage?: number;
  equipmentMultiplier?: number;
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
 * Calculates damage dealt by a single workout set, with optional equipment bonuses.
 *
 * Formula:
 * 1. Workout Base Effort = BASE_SET_DAMAGE + (reps * REP_DAMAGE_SCALE) + loadBonus
 * 2. Equipment Flat Bonus = equipBonus.bonusDamage (capped)
 * 3. Equipment Multiplier = 1.0 + equipBonus.damageMultiplier (capped)
 * 4. Subtotal = (Workout Base + Equipment Flat) * classMultiplier * Equipment Multiplier
 * 5. Crit Roll = roll < (BASE_CRIT_CHANCE + equipBonus.critChanceBonus)
 * 6. Crit Multiplier = BASE_CRIT_MULTIPLIER + equipBonus.critMultiplierBonus
 * 7. Final Damage = round(Subtotal * Crit Multiplier)
 */
export function calculateSetDamage(
  set: ExerciseSet,
  exerciseName?: string,
  equipmentBonus?: EquipmentCombatBonusInput,
  doctrineId?: string
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

  // 4. Equipment Combat Modifiers (strictly capped to prevent runaway inflation)
  const equipFlatBonus = Math.max(0, equipmentBonus?.bonusDamage ?? equipmentBonus?.totalBonusDamage ?? 0);
  const equipMultiplier = Math.max(0, equipmentBonus?.damageMultiplier ?? equipmentBonus?.totalDamageMultiplier ?? 0);

  // 5. Set Classification Multiplier
  const classMultiplier =
    DAMAGE_CONFIG.CLASSIFICATION_MULTIPLIERS[classification] ?? 1.0;

  // 5b. Combat Doctrine Multipliers
  let doctrineMultiplier = 1.0;
  let doctrineCritBonus = 0;
  if (doctrineId === 'iron_juggernaut') {
    // +15% Damage on heavy sets (<= 6 reps)
    if (reps > 0 && reps <= 6) {
      doctrineMultiplier += 0.15;
    }
  } else if (doctrineId === 'serrated_cadence') {
    // +4% per consecutive set number (up to +20%)
    const setNum = Math.max(1, set.setNumber || 1);
    doctrineMultiplier += Math.min(0.20, (setNum - 1) * 0.04);
  } else if (doctrineId === 'scout_recon') {
    // +20% Critical Strike Chance on bodyweight (weight === 0) or high reps (>= 12)
    if (rawWeight === 0 || reps >= 12) {
      doctrineCritBonus += 0.20;
    }
  }

  // 6. Critical Strike Determination (deterministic based on set.id)
  const effectiveCritChance = Math.min(
    0.75,
    DAMAGE_CONFIG.CRIT_CHANCE +
      Math.max(0, equipmentBonus?.critChanceBonus ?? equipmentBonus?.totalCritChanceBonus ?? 0) +
      doctrineCritBonus
  );
  const roll = deterministicPseudoRandom(set.id || `set_${Date.now()}`);
  const isCrit = roll < effectiveCritChance;
  const effectiveCritMultiplier = isCrit
    ? DAMAGE_CONFIG.CRIT_MULTIPLIER + Math.max(0, equipmentBonus?.critMultiplierBonus ?? equipmentBonus?.totalCritMultiplierBonus ?? 0)
    : 1.0;

  // Final Damage Computation
  const subtotal = (baseDamage + repBonus + loadBonus + equipFlatBonus) * classMultiplier * (1 + equipMultiplier) * doctrineMultiplier;
  const finalDamage = Math.max(10, Math.round(subtotal * effectiveCritMultiplier));

  return {
    damage: finalDamage,
    baseDamage,
    repBonus,
    loadBonus,
    classMultiplier,
    isCrit,
    critMultiplier: effectiveCritMultiplier,
    equipmentBonusDamage: equipFlatBonus,
    equipmentMultiplier: equipMultiplier,
  };
}

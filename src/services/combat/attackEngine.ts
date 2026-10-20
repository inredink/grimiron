import { ExerciseDefinition, MovementPattern } from '../../types/exercise';
import { ExerciseSet } from '../../types/workout';
import { AttackCategory, AttackEvent, FactionAttackDefinition } from '../../types/combat';
import { calculateSetDamage, EquipmentCombatBonusInput } from './damageCalculator';
import { EXERCISE_CATALOG } from '../../content/exercises/catalog';
import {
  resolveFactionAttack,
  DEFAULT_FALLBACK_ATTACKS,
} from '../../content/combat/factionAttacks';

export interface AttackDescriptor {
  styleName: string;
  attackPrefix: string;
  visualColor: string;
  visualIcon: string;
  attackDef?: FactionAttackDefinition;
}

/**
 * Determines the combat category ('heavy', 'ranged', 'melee', 'precision', 'defense')
 * derived from the exercise movement pattern and muscle group.
 */
export function getAttackCategoryForExercise(
  exerciseName: string,
  exerciseRefId?: string
): AttackCategory {
  const catalogDef = exerciseRefId
    ? EXERCISE_CATALOG.find((e) => e.id === exerciseRefId)
    : EXERCISE_CATALOG.find(
        (e) => e.name.toLowerCase() === exerciseName.toLowerCase()
      );

  const pattern: MovementPattern = catalogDef ? catalogDef.movementPattern : inferPatternFromName(exerciseName);
  const primaryMuscle = catalogDef ? catalogDef.primaryMuscle : inferMuscleFromName(exerciseName);

  // 1. Core, Mobility, Carry -> Defense / Bulwark Reposition
  if (primaryMuscle === 'core' || primaryMuscle === 'full_body' || pattern === 'carry') {
    return 'defense';
  }

  // 2. Compound Lower Body (Squats, Hinges, Lunges) -> Heavy Seismic Strikes
  if (
    pattern === 'squat' ||
    pattern === 'hinge' ||
    pattern === 'lunge' ||
    primaryMuscle === 'quads' ||
    primaryMuscle === 'hamstrings' ||
    primaryMuscle === 'glutes'
  ) {
    return 'heavy';
  }

  // 3. Upper Body Push (Chest, Shoulders) -> Kinetic Volleys & Ranged Fire
  if (
    pattern === 'push' ||
    primaryMuscle === 'chest' ||
    (primaryMuscle === 'shoulders' && pattern !== 'isolation')
  ) {
    return 'ranged';
  }

  // 4. Upper Body Pull (Back, Lats, Traps) -> Cleaving Blades & Power Strikes
  if (pattern === 'pull' || primaryMuscle === 'back' || primaryMuscle === 'traps') {
    return 'melee';
  }

  // 5. Arms & Delts/Calves Isolation -> Precision Targeting
  return 'precision';
}

/**
 * Maps exercise movement patterns and muscle groups to thematic strike styles.
 * When factionId is supplied, resolves authentic Warhammer 40,000 faction and
 * subfaction attacks from the centralized catalog.
 *
 * If factionId is omitted, cleanly preserves legacy default styles for 100% backward compatibility.
 */
export function getAttackStyleForExercise(
  exerciseName: string,
  exerciseRefId?: string,
  factionId?: string,
  subfactionId?: string,
  seed?: string | number
): AttackDescriptor {
  const category = getAttackCategoryForExercise(exerciseName, exerciseRefId);

  // If no faction is selected or resolved, return legacy default Imperial style
  if (!factionId) {
    return getLegacyAttackStyle(category);
  }

  // Resolve faction attack from catalog with subfaction override support
  const attackDef = resolveFactionAttack({
    factionId,
    subfactionId,
    category,
    seed: seed !== undefined ? seed : exerciseName,
  });

  return {
    styleName: attackDef.styleName,
    attackPrefix: attackDef.name,
    visualColor: attackDef.visualColor,
    visualIcon: attackDef.visualIcon,
    attackDef,
  };
}

/**
 * Legacy attack style fallback mapping for backward compatibility.
 */
function getLegacyAttackStyle(category: AttackCategory): AttackDescriptor {
  switch (category) {
    case 'defense':
      return {
        styleName: 'Bulwark Reposition',
        attackPrefix: 'Aegis Shield Slam',
        visualColor: '#2ECC71',
        visualIcon: 'shield-checkmark-outline',
      };
    case 'heavy':
      return {
        styleName: 'Heavy Seismic Strike',
        attackPrefix: 'Thunder Hammer',
        visualColor: '#FFB800',
        visualIcon: 'flash',
      };
    case 'ranged':
      return {
        styleName: 'Armor-Piercing Volley',
        attackPrefix: 'Bolter Burst',
        visualColor: '#00F0FF',
        visualIcon: 'radio-outline',
      };
    case 'melee':
      return {
        styleName: 'Serrated Cleave',
        attackPrefix: 'Chainsword Slash',
        visualColor: '#FF4757',
        visualIcon: 'flame',
      };
    case 'precision':
    default:
      return {
        styleName: 'Precision Strike',
        attackPrefix: 'Laser Lance',
        visualColor: '#A29BFE',
        visualIcon: 'locate-outline',
      };
  }
}

/**
 * Fallback pattern inference if custom exercise definition is not in standard catalog.
 */
function inferPatternFromName(name: string): MovementPattern {
  const lower = name.toLowerCase();
  if (lower.includes('squat') || lower.includes('leg press')) return 'squat';
  if (lower.includes('deadlift') || lower.includes('rdl') || lower.includes('hip thrust')) return 'hinge';
  if (lower.includes('lunge') || lower.includes('split squat')) return 'lunge';
  if (lower.includes('press') || lower.includes('push') || lower.includes('dip')) return 'push';
  if (lower.includes('row') || lower.includes('pull') || lower.includes('chin')) return 'pull';
  if (lower.includes('curl') || lower.includes('extension') || lower.includes('raise')) return 'isolation';
  return 'isolation';
}

function inferMuscleFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('squat') || lower.includes('leg')) return 'quads';
  if (lower.includes('deadlift')) return 'hamstrings';
  if (lower.includes('bench') || lower.includes('chest') || lower.includes('pushup')) return 'chest';
  if (lower.includes('row') || lower.includes('pullup') || lower.includes('lat')) return 'back';
  if (lower.includes('bicep') || lower.includes('curl')) return 'biceps';
  if (lower.includes('tricep')) return 'triceps';
  return 'chest';
}

/**
 * Generates an idempotent AttackEvent for a completed set with faction-specific attack names.
 */
export function createAttackFromSet(
  set: ExerciseSet,
  exerciseName: string,
  exerciseRefId?: string,
  factionId?: string,
  subfactionId?: string,
  equipmentBonus?: EquipmentCombatBonusInput
): AttackEvent {
  const style = getAttackStyleForExercise(
    exerciseName,
    exerciseRefId,
    factionId,
    subfactionId,
    set.id
  );
  const damageResult = calculateSetDamage(set, exerciseName, equipmentBonus);

  // Format thematic attack name: e.g. "Pulse Rifle Volley [Bench Press]" or "CRITICAL BOLTER BURST [Bench Press]"
  const cleanExercise = exerciseName.replace(/(Barbell|Dumbbell|Resistance Band|Cable|Machine)\s+/i, '');
  const attackName = damageResult.isCrit
    ? `CRITICAL ${style.attackPrefix.toUpperCase()} [${cleanExercise}]`
    : `${style.attackPrefix} [${cleanExercise}]`;

  return {
    id: `atk_${set.id}`,
    setId: set.id,
    exerciseId: set.exerciseId,
    exerciseName,
    attackName,
    styleName: style.styleName,
    visualColor: style.visualColor,
    visualIcon: style.visualIcon,
    damage: damageResult.damage,
    reps: set.reps,
    weight: set.weight,
    unit: set.unit,
    setClassification: set.setClassification || 'working',
    isCrit: damageResult.isCrit,
    critMultiplier: damageResult.critMultiplier,
    timestamp: new Date().toISOString(),
    attackId: style.attackDef?.id,
    flavorDescription: style.attackDef?.flavorDescription,
    factionId: style.attackDef?.factionId || factionId,
    subfactionId: style.attackDef?.subfactionId || subfactionId,
  };
}

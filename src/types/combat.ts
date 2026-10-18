import { WeightUnit, SetClassification } from './workout';
import { MovementPattern, ExerciseCategory } from './exercise';

export type EnemyDifficulty = 'patrol' | 'skirmish' | 'incursion' | 'boss' | 'crusade';

export interface EnemyVisual {
  iconName: string; // Ionicons glyph name
  primaryColor: string;
  accentColor: string;
  badgeText: string;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  title: string;
  faction: string;
  loreDescription: string;
  baseHealth: number;
  difficulty: EnemyDifficulty;
  visual: EnemyVisual;
  defeatQuote: string;
  tauntQuote: string;
}

export interface CombatMission {
  id: string;
  title: string;
  briefing: string;
  difficulty: EnemyDifficulty;
  enemyId: string;
  recommendedSets: number;
  gloryBonusXp: number; // Bonus XP granted on enemy elimination
}

export interface AttackStyle {
  id: string;
  name: string;
  descriptor: string;
  visualColor: string;
  visualIcon: string;
  movementPattern: MovementPattern;
}

export type AttackCategory = 'heavy' | 'ranged' | 'melee' | 'precision' | 'defense' | 'special';

export interface FactionAttackDefinition {
  id: string;
  name: string;
  factionId: string;
  subfactionId?: string;
  category: AttackCategory;
  styleName: string;
  visualColor: string;
  visualIcon: string;
  flavorDescription: string;
  sourceNote?: string;
  isCanonical: boolean;
  minLevel?: number;
}

export interface AttackEvent {
  id: string;
  setId: string; // Ties 1:1 with workout set for idempotency
  exerciseId: string;
  exerciseName: string;
  attackName: string;
  styleName: string;
  visualColor: string;
  visualIcon: string;
  damage: number;
  reps: number;
  weight: number;
  unit: WeightUnit;
  setClassification: SetClassification;
  isCrit: boolean;
  critMultiplier: number;
  timestamp: string;
  attackId?: string;
  flavorDescription?: string;
  factionId?: string;
  subfactionId?: string;
}

export interface CombatEncounterState {
  missionId: string;
  enemy: EnemyDefinition;
  maxHealth: number;
  currentHealth: number;
  isDefeated: boolean;
  totalDamage: number;
  overkillDamage: number;
  attacks: AttackEvent[];
  lastAttack?: AttackEvent;
}

export interface CombatAfterActionReport {
  mission: CombatMission;
  enemy: EnemyDefinition;
  isVictory: boolean;
  totalDamage: number;
  enemyRemainingHealth: number;
  overkillDamage: number;
  completedSetsCount: number;
  totalVolumeKg: number;
  attacks: AttackEvent[];
  baseXpEarned: number;
  gloryBonusXp: number;
  totalXpEarned: number;
  prevLevel: number;
  newLevel: number;
  prevRank: string;
  newRank: string;
  progressPercent: number;
  achievementsUnlocked: string[];
}

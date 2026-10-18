import { EnemyDifficulty } from './combat';

export type MissionCategory =
  | 'patrol'       // Patrols & reconnaissance
  | 'elimination'  // Target elimination & hunting
  | 'defense'      // Defensive operations & fortification
  | 'assault'      // Offensive spearhead assaults
  | 'boss'         // Formidable boss showdowns
  | 'logistics'    // Munitions & volume endurance
  | 'training'     // Foundational rites & drills
  | 'campaign'     // Multi-stage narrative milestones
  | 'coop'         // Cooperative squad operations
  | 'special';     // Faction-specific unique rites

export type MissionDifficulty = EnemyDifficulty;

export type MissionStatus = 'available' | 'active' | 'completed' | 'locked';

export type MissionObjectiveType =
  | 'complete_workouts'       // Total completed workout sessions
  | 'complete_sets'           // Total valid completed working sets
  | 'volume_kg'               // Total volume moved in kg
  | 'target_reps'             // Total repetitions logged
  | 'exercise_category_sets'  // Completed sets targeting a specific movement/muscle
  | 'combat_damage'           // Damage dealt to combat enemies
  | 'combat_attacks'          // Attacks landed in combat
  | 'defeat_enemy'            // Slaying an enemy (or specific enemy ID)
  | 'coop_attacks'            // Attacks contributed to multiplayer raid
  | 'coop_raid_slain'         // Slaying a raid boss with a squad
  | 'pr_broken'               // Personal records established
  | 'rest_days_honored';      // Scheduled rest days observed for recovery

export interface MissionObjectiveDefinition {
  id: string;
  type: MissionObjectiveType;
  description: string;
  targetValue: number;
  exerciseCategory?: string;  // e.g. 'chest', 'back', 'legs', 'compound'
  enemyId?: string;           // Optional specific enemy ID to defeat
}

export interface MissionObjectiveProgress {
  objectiveId: string;
  currentValue: number;
  targetValue: number;
  isCompleted: boolean;
  progressPercent: number;    // 0 to 100
}

export type MissionRewardType =
  | 'xp'              // Bonus character/crusade XP
  | 'title'           // Military title / honorific
  | 'unlock_mission'  // Unlocks follow-up mission ID in chain
  | 'equipment_ref'   // Stable ID for equipment/relic placeholder
  | 'achievement_ref';// Achievement ID reference

export interface MissionRewardDefinition {
  type: MissionRewardType;
  amount?: number;
  title?: string;
  targetRefId?: string;
  description: string;
}

export interface FactionMissionDefinition {
  id: string;
  title: string;
  shortDescription: string;
  briefing: string;
  factionId: string;
  subfactionId?: string;       // Optional subfaction restriction or specialty
  category: MissionCategory;
  difficulty: MissionDifficulty;
  minRankTier?: number;        // Rank tier requirement (1 to 5)
  prerequisites?: string[];    // Prior mission IDs that must be completed
  objectives: MissionObjectiveDefinition[];
  rewards: MissionRewardDefinition[];
  enemyId?: string;            // Enemy ID for solo combat missions
  isRepeatable?: boolean;
  isCanonical: boolean;        // True if rooted in established canon, false if game-designed
  sourceNote?: string;
  iconName: string;            // Ionicons glyph name
  themeColor?: string;         // Custom faction accent override
}

export interface ActiveMissionRecord {
  id: string;
  missionId: string;
  factionId: string;
  subfactionId?: string;
  characterId: string;
  status: MissionStatus;
  objectives: MissionObjectiveProgress[];
  startedAt?: string;
  completedAt?: string;
  rewards: MissionRewardDefinition[];
  isClaimed: boolean;
  mission?: FactionMissionDefinition;
}

export interface MissionFilter {
  status?: MissionStatus | 'all';
  category?: MissionCategory | 'all';
  difficulty?: MissionDifficulty | 'all';
  factionId?: string;
  subfactionId?: string;
  searchQuery?: string;
  sortBy?: 'difficulty' | 'name' | 'progress';
}

export interface MissionEvaluationContext {
  characterId: string;
  factionId: string;
  subfactionId?: string;
  rankTier: number;
  characterLevel: number;
  completedWorkoutsCount: number;
  completedSetsCount: number;
  totalReps: number;
  totalVolumeKg: number;
  categorySetsCount?: Record<string, number>;
  totalCombatDamage: number;
  totalCombatAttacks: number;
  enemiesDefeatedIds: string[];
  coopAttacksCount: number;
  coopBossesDefeatedCount: number;
  personalRecordsBrokenCount: number;
  completedMissionIds: string[];
}

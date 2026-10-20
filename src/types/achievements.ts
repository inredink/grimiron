export type AchievementScope = 'user' | 'character' | 'squad';

export type AchievementCategory =
  | 'workouts' // Workout completion and participation
  | 'volume' // Sets, repetitions, and training-volume milestones
  | 'variety' // Exercise variety and training exploration
  | 'personal_records' // Personal improvement and personal records
  | 'consistency' // Consistency, sustainable habits, and recovery
  | 'combat' // Combat actions and attack milestones
  | 'bosses' // Boss battles and battle-history accomplishments
  | 'squad' // Squad cooperation and collaborative milestones
  | 'progression' // Character levels, ranks, factions, and progression
  | 'equipment' // Equipment collection and character customization
  | 'campaigns'; // Campaigns, missions, and exploration

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'relic';

export interface AchievementCriterion {
  type:
    | 'count_workouts'
    | 'count_sets'
    | 'count_reps'
    | 'total_volume_kg'
    | 'single_set_volume_kg'
    | 'distinct_exercises'
    | 'distinct_categories'
    | 'distinct_equipment'
    | 'pr_broken_count'
    | 'single_lift_weight_kg'
    | 'weekly_streak_weeks'
    | 'return_after_rest_days'
    | 'rest_day_taken'
    | 'combat_attacks_count'
    | 'combat_crits_count'
    | 'total_combat_damage'
    | 'solo_boss_defeated'
    | 'distinct_enemies_defeated'
    | 'coop_boss_defeated'
    | 'coop_attacks_count'
    | 'squad_shared_damage'
    | 'character_level'
    | 'rank_tier'
    | 'distinct_factions_tried'
    | 'custom_equipment_count'
    | 'campaign_missions_completed';
  targetValue: number;
  exerciseRefId?: string;
  category?: string;
  factionId?: string;
  subfactionId?: string;
  enemyId?: string;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  scope: AchievementScope;
  tier: AchievementTier;
  icon: string; // Ionicons icon glyph name
  criterion: AchievementCriterion;
  rewardXp: number;
  factionRestriction?: string;
  subfactionRestriction?: string;
  isRepeatable?: boolean;
}

export interface AchievementProgress {
  id: string;
  achievementId: string;
  scope: AchievementScope;
  targetId: string; // userId, characterId, or squadId
  currentValue: number;
  targetValue: number;
  progressPercent: number; // 0 to 100
  isCompleted: boolean;
  unlockedAt?: string;
  lastUpdatedAt: string;
}

export interface AchievementAward {
  id: string;
  achievementId: string;
  scope: AchievementScope;
  targetId: string;
  tier: number;
  unlockedAt: string;
  sourceEventType: string;
  sourceRefId?: string;
  rewardXp: number;
  rewardClaimed: boolean;
  achievement?: AchievementDefinition;
}

export interface AchievementFilter {
  scope?: AchievementScope | 'all';
  status?: 'all' | 'earned' | 'in_progress' | 'locked';
  category?: AchievementCategory | 'all';
  searchQuery?: string;
  sortBy?: 'recently_earned' | 'highest_progress' | 'category' | 'tier';
}

export interface AchievementEvaluationContext {
  userId: string;
  characterId: string;
  characterTotalXp: number;
  characterLevel: number;
  rankTier: number;
  factionId: string;
  subfactionId?: string;
  squadId?: string;
  squadBossDefeated?: boolean;
  completedWorkoutsCount: number;
  completedSetsCount: number;
  totalReps: number;
  totalVolumeKg: number;
  distinctExercisesCount: number;
  distinctCategoriesCount: number;
  distinctEquipmentCount: number;
  personalRecordsBrokenCount: number;
  maxSingleLiftWeightKg: number;
  maxSingleSetVolumeKg: number;
  consecutiveTrainingWeeks: number;
  longestRestDaysHonored: number;
  totalCombatAttacks: number;
  totalCombatCrits: number;
  totalCombatDamage: number;
  soloBossesDefeatedCount: number;
  distinctEnemiesDefeatedCount: number;
  coopBossesDefeatedCount: number;
  coopAttacksCount: number;
  squadSharedDamageDealt: number;
  distinctFactionsExploredCount: number;
  campaignMissionsCompletedCount: number;
  customEquipmentCount?: number;
  latestWorkoutSessionId?: string;
  latestBattleId?: string;
}

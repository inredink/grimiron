export interface CharacterProfile {
  id: number;
  universeId: string;
  factionId: string;
  subfactionId?: string;
  characterName: string;
  totalXp: number;
  currentLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterProgression {
  level: number;
  totalXp: number;
  currentLevelBaseXp: number;
  nextLevelXp: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number; // 0 to 100
  currentRankTitle: string;
  currentRankTier: number;
  nextRankTitle?: string;
  nextRankTier?: number;
  xpNeededForNextRank?: number;
  rankProgressPercent: number; // 0 to 100
  portraitUrl?: string;
  pendingMilestoneRequirement?: string;
  isRankTrialPending?: boolean;
}

export interface UserStats {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
  totalXpEarned: number;
}

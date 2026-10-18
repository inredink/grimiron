import { AttackEvent, EnemyDifficulty } from './combat';

export type BattleOutcome = 'victory' | 'defeat' | 'abandoned' | 'in_progress' | 'escaped';
export type EncounterMode = 'solo' | 'coop' | 'weekly_raid';

export interface BattleParticipantContribution {
  userId: string;
  callsign: string;
  factionId: string;
  subfactionId?: string;
  attacksCount: number;
  damageDealt: number;
  damageSharePercent: number; // 0 to 100
  workoutsAttributed: number;
  setsAttributed: number;
}

export interface BattleTimelineEvent {
  timestamp: string;
  eventType: 'battle_started' | 'strike_landed' | 'critical_strike' | 'phase_change' | 'enemy_slain' | 'tactical_retreat';
  actorName: string;
  description: string;
  damageDealt?: number;
  remainingHp?: number;
}

export interface BattleRewardsSummary {
  baseXpEarned: number;
  gloryBonusXp: number;
  totalXpEarned: number;
  promotionsEarned?: string[];
  achievementsUnlocked?: string[];
  lootOrWargear?: string[];
}

export interface BattleSnapshot {
  enemyDescription: string;
  enemyGlyph: string;
  enemyFaction: string;
  initialHealth: number;
  finalHealth: number;
  timeline: BattleTimelineEvent[];
  participants: BattleParticipantContribution[];
  userAttacks: AttackEvent[];
  linkedWorkoutIds: string[];
  rewards: BattleRewardsSummary;
  afterActionReportSummary: string;
}

export interface BattleRecord {
  id: string;
  encounterMode: EncounterMode;
  sessionId?: string; // Ties directly to local workout session if applicable
  missionId?: string;
  missionTitle: string;
  enemyId: string;
  enemyName: string;
  enemyFaction?: string;
  enemyDifficulty?: EnemyDifficulty;
  enemyMaxHp: number;
  enemyRemainingHp: number;
  outcome: BattleOutcome;
  totalDamage: number;
  totalAttacks: number;
  participantCount: number;
  squadId?: string;
  squadName?: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  xpEarned: number;
  snapshot: BattleSnapshot;
  createdAt: string;
}

export interface BattleHistoryFilter {
  outcome?: BattleOutcome | 'all';
  encounterMode?: EncounterMode | 'all';
  enemyId?: string;
  squadId?: string;
  searchQuery?: string;
  sortBy?: 'recent' | 'oldest' | 'highest_damage';
}

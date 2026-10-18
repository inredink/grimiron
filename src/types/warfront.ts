import { EnemyDifficulty, EnemyVisual, CombatMission, CombatEncounterState } from './combat';

export type EncounterCategory =
  | 'recon'
  | 'assault'
  | 'defense'
  | 'sabotage'
  | 'hunting'
  | 'special_ops'
  | 'escalating'
  | 'coop';

export interface EncounterModifier {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  hpMultiplier?: number;
  xpMultiplier?: number;
}

export interface EncounterTemplate {
  id: string;
  title: string;
  category: EncounterCategory;
  difficulty: EnemyDifficulty;
  enemyFactionId: string;
  enemyFactionName: string;
  enemyName: string;
  enemyTitle: string;
  enemyLore: string;
  briefing: string;
  tacticalObjective: string;
  recommendedSets: number;
  recommendedIntensity: string;
  baseHealth: number;
  baseXpBonus: number;
  modifiers: EncounterModifier[];
  iconName: string;
  primaryColor: string;
  accentColor: string;
  tauntQuote?: string;
  defeatQuote?: string;
}

export interface DailyRotationRecord {
  rotationDate: string; // YYYY-MM-DD
  offeredEncounterIds: string[];
  completedEncounterIds: string[];
  activeEncounterId?: string;
  updatedAt: string;
}

export interface BossPhaseDefinition {
  phaseNumber: number;
  title: string;
  hpThresholdPercent: number; // e.g. 100, 66, 33
  description: string;
  visualColor: string;
  taunt: string;
}

export type BossDifficultyTier = 'standard' | 'challenging' | 'legendary';

export interface GeneratedBossIdentity {
  bossKey: string;
  name: string;
  title: string;
  factionId: string;
  factionName: string;
  subfactionId?: string;
  subfactionName?: string;
  archetype: string;
  combatRole: string;
  difficultyTier: BossDifficultyTier;
  honorific: string;
  signatureWeapon: string;
  combatTrait: string;
  tacticalDescription: string;
  loreDescription: string;
  baseHealth: number;
  glyph: string;
  primaryColor: string;
  accentColor: string;
  phases: BossPhaseDefinition[];
  taunts: string[];
  defeatQuote: string;
  generationSeed?: string;
  version?: string;
}

export type RaidSpawnDay = 'friday' | 'saturday';
export type RaidStatus = 'active' | 'defeated' | 'escaped';
export type RaidAvailability = 'available' | 'locked' | 'concluded';

export interface RaidParticipantContribution {
  userId: string;
  callsign: string;
  factionId: string;
  damage: number;
  attacksCount: number;
  workoutsCount: number;
  lastContributedAt: string;
}

export interface WeeklyRaidCycle {
  cycleId: string; // e.g. "2026_W42_saturday"
  scope: 'squad' | 'individual';
  squadId?: string;
  squadName?: string;
  boss: GeneratedBossIdentity;
  maxHp: number;
  currentHp: number;
  status: RaidStatus;
  spawnDay: RaidSpawnDay;
  startedAt: string;
  expiresAt: string;
  timezone?: string;
  raidAvailability?: RaidAvailability;
  isRewardClaimed: boolean;
  contributions: Record<string, RaidParticipantContribution>;
  updatedAt: string;
}

export interface WarfrontSettings {
  preferredSpawnDay: RaidSpawnDay;
  categoryFilter: EncounterCategory | 'all';
}

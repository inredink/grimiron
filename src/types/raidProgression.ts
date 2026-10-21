import { EquipmentDefinition } from './equipment';

export type RaidTierId =
  | 'tier_1_initiation'
  | 'tier_2_field_ops'
  | 'tier_3_veteran'
  | 'tier_4_elite'
  | 'tier_5_champion'
  | 'tier_6_legendary'
  | 'tier_7_endgame';

export interface RaidTierDefinition {
  id: RaidTierId;
  tierNumber: number; // 1 to 7
  name: string;
  codeName: string;
  description: string;
  loreBriefing: string;
  minLevel: number;
  minRankTier: number;
  minGearPower: number;
  requiredPreviousTierId?: RaidTierId;
  soloHp: number;
  squadHp: number;
  gloryXpReward: number;
  recommendedSets: number;
  color: string;
  icon: string;
  dropRarityFloor: string;
}

export interface RaidEligibilityContext {
  characterLevel: number;
  characterRankTier: number;
  gearPower: number;
  characterFactionId: string;
  defeatedRaidTiers: RaidTierId[];
}

export interface RaidEligibilityRequirementCheck {
  met: boolean;
  required: string;
  current: string;
  label: string;
}

export interface RaidEligibilityResult {
  isEligible: boolean;
  tierId: RaidTierId;
  tierName: string;
  tierNumber: number;
  unmetRequirements: string[];
  primaryLockReason?: string;
  checks: {
    level: RaidEligibilityRequirementCheck;
    rank: RaidEligibilityRequirementCheck;
    gearPower: RaidEligibilityRequirementCheck;
    prerequisiteRaid: RaidEligibilityRequirementCheck;
    faction: RaidEligibilityRequirementCheck;
  };
}

export interface CharacterRaidProgressionRecord {
  characterId: string;
  highestTierUnlocked: RaidTierId;
  tierVictories: Partial<Record<RaidTierId, number>>;
  totalRaidVictories: number;
  lastDefeatedTier?: RaidTierId;
  lastVictoryAt?: string;
}

export interface GearPowerCalculationResult {
  gearPower: number;
  averageTier: number;
  itemCount: number;
  primaryTierLabel: string;
}

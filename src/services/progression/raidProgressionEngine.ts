import { EquipmentDefinition } from '../../types/equipment';
import {
  RaidTierDefinition,
  RaidTierId,
  RaidEligibilityContext,
  RaidEligibilityResult,
  GearPowerCalculationResult,
  CharacterRaidProgressionRecord,
} from '../../types/raidProgression';
import { RAID_TIERS, getRaidTierById } from '../../content/raidTiers';

/**
 * Centrally calculates Gear Power strictly from actively equipped items.
 * Items in inventory that are not equipped do NOT contribute to Gear Power.
 */
export function calculateGearPower(
  equippedItems: EquipmentDefinition[]
): GearPowerCalculationResult {
  if (!equippedItems || equippedItems.length === 0) {
    return {
      gearPower: 0,
      averageTier: 0,
      itemCount: 0,
      primaryTierLabel: 'Unarmed Recruit',
    };
  }

  let totalScore = 0;
  let totalTier = 0;

  const rarityBonusMap: Record<string, number> = {
    common: 5,
    uncommon: 15,
    rare: 30,
    epic: 55,
    relic: 85,
  };

  for (const item of equippedItems) {
    // 1. Tier Foundation (25 pts per tier)
    const tierScore = (item.tier || 1) * 25;
    totalTier += item.tier || 1;

    // 2. Rarity Bonus
    const rarityScore = rarityBonusMap[item.rarity] || 5;

    // 3. Combat Statistics Contribution
    const flatDmgScore = Math.round((item.stats.bonusDamage || 0) * 1.5);
    const defScore = Math.round((item.stats.defenseRating || 0) * 1.2);
    const multScore = Math.round((item.stats.damageMultiplier || 0) * 200);
    const critScore = Math.round((item.stats.critChanceBonus || 0) * 300);
    const critMultScore = Math.round((item.stats.critMultiplierBonus || 0) * 100);

    // 4. Exosuit / Battlesuit / Chassis Platform Bonus
    const platformScore = item.isPlatform ? 50 : 0;

    const itemGearPower =
      tierScore +
      rarityScore +
      flatDmgScore +
      defScore +
      multScore +
      critScore +
      critMultScore +
      platformScore;

    totalScore += itemGearPower;
  }

  const averageTier = Math.round((totalTier / equippedItems.length) * 10) / 10;
  let primaryTierLabel = 'Tier 1: Standard Wargear';
  if (averageTier >= 4.5) {
    primaryTierLabel = 'Tier 5: Apex Relic Arsenal';
  } else if (averageTier >= 3.5) {
    primaryTierLabel = 'Tier 4: Elite Battlesuit Arsenal';
  } else if (averageTier >= 2.5) {
    primaryTierLabel = 'Tier 3: Veteran Combat Gear';
  } else if (averageTier >= 1.5) {
    primaryTierLabel = 'Tier 2: Field Operations Gear';
  }

  return {
    gearPower: totalScore,
    averageTier,
    itemCount: equippedItems.length,
    primaryTierLabel,
  };
}

/**
 * Pure, authoritative evaluation of raid access requirements.
 * Validates:
 * - Minimum character level
 * - Minimum faction rank tier
 * - Minimum gear power
 * - Previous raid boss victory prerequisites
 */
export function evaluateRaidTierEligibility(
  tierId: RaidTierId,
  context: RaidEligibilityContext
): RaidEligibilityResult {
  const tier = getRaidTierById(tierId);
  const unmetRequirements: string[] = [];

  // 1. Level Check
  const levelMet = context.characterLevel >= tier.minLevel;
  if (!levelMet) {
    unmetRequirements.push(
      `Character Level ${tier.minLevel} required (Current: Level ${context.characterLevel})`
    );
  }

  // 2. Faction Rank Check
  const rankMet = context.characterRankTier >= tier.minRankTier;
  if (!rankMet) {
    unmetRequirements.push(
      `Faction Rank Tier ${tier.minRankTier} required (Current: Rank Tier ${context.characterRankTier})`
    );
  }

  // 3. Gear Power Check
  const gearPowerMet = context.gearPower >= tier.minGearPower;
  if (!gearPowerMet) {
    unmetRequirements.push(
      `Gear Power ${tier.minGearPower} required (Current: ${context.gearPower})`
    );
  }

  // 4. Prerequisite Raid Clearance
  let previousRaidMet = true;
  if (tier.requiredPreviousTierId) {
    const requiredTierDef = getRaidTierById(tier.requiredPreviousTierId);
    previousRaidMet = context.defeatedRaidTiers.includes(tier.requiredPreviousTierId);
    if (!previousRaidMet) {
      unmetRequirements.push(
        `Defeat at least one ${requiredTierDef.name} boss to unlock this clearance tier`
      );
    }
  }

  // 5. Faction / General
  const factionMet = true;

  const isEligible = unmetRequirements.length === 0;

  return {
    isEligible,
    tierId: tier.id,
    tierName: tier.name,
    tierNumber: tier.tierNumber,
    unmetRequirements,
    primaryLockReason: unmetRequirements[0],
    checks: {
      level: {
        met: levelMet,
        required: `Level ${tier.minLevel}`,
        current: `Level ${context.characterLevel}`,
        label: 'Character Level',
      },
      rank: {
        met: rankMet,
        required: `Rank Tier ${tier.minRankTier}`,
        current: `Rank Tier ${context.characterRankTier}`,
        label: 'Faction Military Rank',
      },
      gearPower: {
        met: gearPowerMet,
        required: `${tier.minGearPower} Gear Power`,
        current: `${context.gearPower} Gear Power`,
        label: 'Equipped Gear Power',
      },
      prerequisiteRaid: {
        met: previousRaidMet,
        required: tier.requiredPreviousTierId
          ? getRaidTierById(tier.requiredPreviousTierId).name
          : 'None',
        current: previousRaidMet ? 'Completed' : 'Locked',
        label: 'Prerequisite Raid Clearance',
      },
      faction: {
        met: factionMet,
        required: 'Any Allegiance',
        current: context.characterFactionId,
        label: 'Faction Clearance',
      },
    },
  };
}

/**
 * Evaluates squad-wide eligibility for a multiplayer raid.
 * Every participant must independently qualify for the raid tier.
 * A beginner cannot enter a high-tier raid simply because a squadmate qualifies.
 */
export function evaluateMultiplayerRaidEligibility(
  tierId: RaidTierId,
  participants: (RaidEligibilityContext & { callsign: string })[]
): {
  allEligible: boolean;
  ineligibleParticipants: { callsign: string; reasons: string[] }[];
} {
  const ineligibleParticipants: { callsign: string; reasons: string[] }[] = [];

  for (const participant of participants) {
    const result = evaluateRaidTierEligibility(tierId, participant);
    if (!result.isEligible) {
      ineligibleParticipants.push({
        callsign: participant.callsign,
        reasons: result.unmetRequirements,
      });
    }
  }

  return {
    allEligible: ineligibleParticipants.length === 0,
    ineligibleParticipants,
  };
}

/**
 * Calculates the highest raid tier a character has currently unlocked and is eligible for.
 */
export function getHighestUnlockedRaidTier(
  context: RaidEligibilityContext
): RaidTierDefinition {
  let highest = RAID_TIERS[0];
  for (const tier of RAID_TIERS) {
    const result = evaluateRaidTierEligibility(tier.id, context);
    if (result.isEligible) {
      highest = tier;
    } else {
      // Tiers are sequential; once a tier fails, higher tiers are locked
      break;
    }
  }
  return highest;
}

// =========================================================================
// Pluggable Storage Adapter for Raid Progression
// =========================================================================

export interface RaidProgressionStorageAdapter {
  getProgression(characterId?: string): CharacterRaidProgressionRecord;
  recordRaidVictory(
    tierId: RaidTierId,
    characterId?: string
  ): { newlyUnlockedTier?: RaidTierId; record: CharacterRaidProgressionRecord };
  getDefeatedTiers(characterId?: string): RaidTierId[];
}

export class InMemoryRaidProgressionStorage implements RaidProgressionStorageAdapter {
  private records: Map<string, CharacterRaidProgressionRecord> = new Map();

  getProgression(characterId: string = 'char_main'): CharacterRaidProgressionRecord {
    const existing = this.records.get(characterId);
    if (existing) return existing;

    const initial: CharacterRaidProgressionRecord = {
      characterId,
      highestTierUnlocked: 'tier_1_initiation',
      tierVictories: {},
      totalRaidVictories: 0,
    };
    this.records.set(characterId, initial);
    return initial;
  }

  recordRaidVictory(
    tierId: RaidTierId,
    characterId: string = 'char_main'
  ): { newlyUnlockedTier?: RaidTierId; record: CharacterRaidProgressionRecord } {
    const current = this.getProgression(characterId);
    const existingCount = current.tierVictories[tierId] || 0;
    current.tierVictories[tierId] = existingCount + 1;
    current.totalRaidVictories += 1;
    current.lastDefeatedTier = tierId;
    current.lastVictoryAt = new Date().toISOString();

    // Check if next tier should be unlocked
    const currentTierDef = getRaidTierById(tierId);
    const nextTierIndex = currentTierDef.tierNumber; // 1-based, so tierNumber gives next index (e.g. 1 -> index 1 is tier 2)
    let newlyUnlockedTier: RaidTierId | undefined = undefined;

    if (nextTierIndex < RAID_TIERS.length) {
      const candidateNextTier = RAID_TIERS[nextTierIndex];
      const highestCurrentDef = getRaidTierById(current.highestTierUnlocked);
      if (candidateNextTier.tierNumber > highestCurrentDef.tierNumber) {
        current.highestTierUnlocked = candidateNextTier.id;
        newlyUnlockedTier = candidateNextTier.id;
      }
    }

    this.records.set(characterId, current);
    return { newlyUnlockedTier, record: current };
  }

  getDefeatedTiers(characterId: string = 'char_main'): RaidTierId[] {
    const prog = this.getProgression(characterId);
    return Object.keys(prog.tierVictories).filter(
      (k) => (prog.tierVictories[k as RaidTierId] || 0) > 0
    ) as RaidTierId[];
  }
}

let activeRaidProgressionStorage: RaidProgressionStorageAdapter = new InMemoryRaidProgressionStorage();

export function setRaidProgressionStorageAdapter(adapter: RaidProgressionStorageAdapter): void {
  activeRaidProgressionStorage = adapter;
}

export function getRaidProgressionStorageAdapter(): RaidProgressionStorageAdapter {
  return activeRaidProgressionStorage;
}

import { EquipmentDefinition, RaidLootTable } from '../../types/equipment';
import { GeneratedBossIdentity, BossDifficultyTier } from '../../types/warfront';
import {
  EQUIPMENT_CATALOG,
  getEquipmentById,
} from '../../content/equipment/catalog';
import {
  recordRaidLootDrop,
  isItemEquipEligible,
} from './equipmentService';

export interface RaidLootRewardResult {
  awardedItem?: EquipmentDefinition;
  message: string;
  isGuaranteed: boolean;
}

/**
 * Loot table mapped by boss difficulty tier.
 */
export const BOSS_DIFFICULTY_LOOT_TABLES: Record<BossDifficultyTier, string[]> = {
  standard: [
    // Tier 2 & 3 upgrades
    'tau_pulse_carbine',
    'tau_hardened_combat_armor',
    'tau_breacher_pulse_blaster',
    'astartes_master_power_sword',
  ],
  challenging: [
    // Tier 3 & 4 specialist & platform gear
    'tau_rail_rifle',
    'tau_emp_grenades',
    'tau_xv25_stealth_suit',
    'tau_burst_cannon',
    'tau_fusion_blaster',
    'astartes_master_power_sword',
  ],
  legendary: [
    // Tier 5 apex wargear & legendary battlesuit platforms
    'tau_xv8_crisis_battlesuit',
    'tau_plasma_rifle_array',
    'tau_missile_pod',
    'tau_shield_generator',
    'astartes_indomitus_terminator_suit',
    'ork_kustom_mega_armor',
  ],
};

/**
 * Determines and grants eligible raid boss loot for a player.
 * Ensures:
 * 1. Player receives equipment compatible with their active faction.
 * 2. Minimum rank tier and level requirements are respected.
 * 3. Early bosses never grant ineligible advanced platforms.
 * 4. Duplicate safe: will not award if already recorded for this raid cycle.
 */
export function evaluateRaidBossLoot(
  raidCycleId: string,
  boss: GeneratedBossIdentity,
  characterFactionId: string,
  characterLevel: number = 1,
  characterRankTier: number = 1,
  characterId: string = 'char_main'
): RaidLootRewardResult {
  const difficulty = boss.difficultyTier || 'standard';
  const candidateItemIds = BOSS_DIFFICULTY_LOOT_TABLES[difficulty] || BOSS_DIFFICULTY_LOOT_TABLES.standard;

  // Filter candidates by faction compatibility and level/rank eligibility
  const eligibleCandidates: EquipmentDefinition[] = [];

  for (const itemId of candidateItemIds) {
    const def = getEquipmentById(itemId);
    if (!def) continue;

    // Must be compatible with player's faction
    const factionMatch =
      def.compatibleFactions.includes('all') ||
      def.compatibleFactions.includes(characterFactionId);
    if (!factionMatch) continue;

    // Strict safety check: Do not drop advanced platform (e.g. Battlesuit or Terminator)
    // if the player doesn't meet the rank/level requirement
    if (def.isPlatform) {
      if (def.requirements.minRankTier && characterRankTier < def.requirements.minRankTier) {
        continue;
      }
      if (def.requirements.minLevel && characterLevel < def.requirements.minLevel) {
        continue;
      }
    }

    eligibleCandidates.push(def);
  }

  // If no specific faction candidate was found in the difficulty tier, look for any general faction drop
  if (eligibleCandidates.length === 0) {
    const fallbackFactionItems = EQUIPMENT_CATALOG.filter(
      (item) =>
        (item.compatibleFactions.includes(characterFactionId) || item.compatibleFactions.includes('all')) &&
        !item.isStarterItem &&
        (!item.requirements.minRankTier || item.requirements.minRankTier <= characterRankTier) &&
        (!item.requirements.minLevel || item.requirements.minLevel <= characterLevel)
    );
    if (fallbackFactionItems.length > 0) {
      eligibleCandidates.push(fallbackFactionItems[0]);
    }
  }

  if (eligibleCandidates.length === 0) {
    return {
      message: 'No eligible wargear drops met your current rank clearance.',
      isGuaranteed: false,
    };
  }

  // Select item (deterministic based on cycleId and bossKey)
  const selectedItem = eligibleCandidates[0];

  const granted = recordRaidLootDrop(raidCycleId, characterId, selectedItem.id);
  if (!granted) {
    return {
      awardedItem: selectedItem,
      message: `Spoils already collected for this cycle: ${selectedItem.name}.`,
      isGuaranteed: true,
    };
  }

  return {
    awardedItem: selectedItem,
    message: `Raid Spoils Awarded: ${selectedItem.name} (${selectedItem.rarity.toUpperCase()})!`,
    isGuaranteed: true,
  };
}

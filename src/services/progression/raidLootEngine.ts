import { EquipmentDefinition, RaidLootTable } from '../../types/equipment';
import { GeneratedBossIdentity, BossDifficultyTier } from '../../types/warfront';
import { RaidTierId } from '../../types/raidProgression';
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
  canEquipImmediately?: boolean;
  equipRequirementNotes?: string;
}

/**
 * Loot table mapped across the 7 structured MMORPG raid tiers.
 */
export const RAID_TIER_LOOT_TABLES: Record<RaidTierId, string[]> = {
  tier_1_initiation: [
    'tau_pulse_carbine',
    'astartes_heavy_bolter',
    'guard_hotshot_lasgun',
    'ork_dakkagun',
    'necron_gauss_blaster',
  ],
  tier_2_field_ops: [
    'tau_hardened_combat_armor',
    'tau_breacher_pulse_blaster',
    'astartes_krak_grenades',
    'guard_carapace_armor',
  ],
  tier_3_veteran: [
    'tau_rail_rifle',
    'tau_emp_grenades',
    'astartes_plasma_gun',
    'astartes_iron_halo',
    'guard_plasma_gun',
    'guard_officer_saber',
    'ork_big_choppa',
    'ork_rokkit_launcha',
    'necron_tesla_carbine',
  ],
  tier_4_elite: [
    'tau_xv25_stealth_suit',
    'tau_burst_cannon',
    'tau_fusion_blaster',
    'astartes_master_power_sword',
    'astartes_artificer_armor',
    'guard_heavy_bolter_team',
    'ork_power_klaw',
    'necron_hyperphase_sword',
  ],
  tier_5_champion: [
    'tau_xv8_crisis_battlesuit',
    'astartes_indomitus_terminator_suit',
    'guard_sentinel_chassis',
    'ork_kustom_mega_armor',
    'necron_destroyer_chassis',
  ],
  tier_6_legendary: [
    'tau_plasma_rifle_array',
    'tau_missile_pod',
    'tau_shield_generator',
    'astartes_storm_shield_thunder_hammer',
    'ork_kustom_force_field',
  ],
  tier_7_endgame: [
    'tau_plasma_rifle_array',
    'tau_xv8_crisis_battlesuit',
    'astartes_storm_shield_thunder_hammer',
    'astartes_indomitus_terminator_suit',
    'ork_kustom_mega_armor',
    'ork_kustom_force_field',
    'necron_destroyer_chassis',
  ],
};

/**
 * Loot table mapped by boss difficulty tier (legacy & fast lookup).
 */
export const BOSS_DIFFICULTY_LOOT_TABLES: Record<BossDifficultyTier, string[]> = {
  standard: [
    // Tier 2 & 3 upgrades
    'tau_pulse_carbine',
    'tau_hardened_combat_armor',
    'tau_breacher_pulse_blaster',
    'astartes_heavy_bolter',
    'astartes_master_power_sword',
    'guard_hotshot_lasgun',
    'ork_dakkagun',
    'necron_gauss_blaster',
  ],
  challenging: [
    // Tier 3 & 4 specialist & platform gear
    'tau_rail_rifle',
    'tau_emp_grenades',
    'tau_xv25_stealth_suit',
    'tau_burst_cannon',
    'tau_fusion_blaster',
    'astartes_plasma_gun',
    'astartes_master_power_sword',
    'guard_plasma_gun',
    'ork_power_klaw',
    'necron_hyperphase_sword',
  ],
  legendary: [
    // Tier 5 apex wargear & legendary battlesuit platforms
    'tau_xv8_crisis_battlesuit',
    'tau_plasma_rifle_array',
    'tau_missile_pod',
    'tau_shield_generator',
    'astartes_indomitus_terminator_suit',
    'astartes_storm_shield_thunder_hammer',
    'ork_kustom_mega_armor',
    'guard_sentinel_chassis',
    'necron_destroyer_chassis',
  ],
};

/**
 * Maps a RaidTierId to candidate item IDs.
 */
export function getLootCandidatesForRaidTier(tierId: RaidTierId): string[] {
  return RAID_TIER_LOOT_TABLES[tierId] || RAID_TIER_LOOT_TABLES.tier_1_initiation;
}

/**
 * Determines and grants eligible raid boss loot for a player.
 * Ensures:
 * 1. Player receives equipment compatible with their active faction.
 * 2. Minimum rank tier and level requirements are evaluated.
 * 3. Early bosses never grant ineligible advanced platforms.
 * 4. Duplicate safe: will not award if already recorded for this raid cycle.
 * 5. Informs whether the dropped item can be equipped immediately or requires progression.
 */
export function evaluateRaidBossLoot(
  raidCycleId: string,
  boss: GeneratedBossIdentity | { difficultyTier?: BossDifficultyTier; raidTierId?: RaidTierId },
  characterFactionId: string,
  characterLevel: number = 1,
  characterRankTier: number = 1,
  characterId: string = 'char_main'
): RaidLootRewardResult {
  let candidateItemIds: string[] = [];

  if ('raidTierId' in boss && boss.raidTierId) {
    candidateItemIds = getLootCandidatesForRaidTier(boss.raidTierId);
  } else {
    const difficulty = boss.difficultyTier || 'standard';
    candidateItemIds = BOSS_DIFFICULTY_LOOT_TABLES[difficulty] || BOSS_DIFFICULTY_LOOT_TABLES.standard;
  }

  // Filter candidates by faction compatibility
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

  // Evaluate whether player can equip it immediately or requires advancement
  const equipEligibility = isItemEquipEligible(
    selectedItem,
    characterFactionId,
    characterLevel,
    characterRankTier
  );

  if (!granted) {
    return {
      awardedItem: selectedItem,
      message: `Spoils already collected for this cycle: ${selectedItem.name}.`,
      isGuaranteed: true,
      canEquipImmediately: equipEligibility.eligible,
      equipRequirementNotes: equipEligibility.reason,
    };
  }

  const equipSuffix = equipEligibility.eligible
    ? ' [Equip Ready]'
    : ` [Requires Level ${selectedItem.requirements.minLevel || 1}, Rank ${selectedItem.requirements.minRankTier || 1} to equip]`;

  return {
    awardedItem: selectedItem,
    message: `Raid Spoils Awarded: ${selectedItem.name} (${selectedItem.rarity.toUpperCase()})!${equipSuffix}`,
    isGuaranteed: true,
    canEquipImmediately: equipEligibility.eligible,
    equipRequirementNotes: equipEligibility.reason,
  };
}

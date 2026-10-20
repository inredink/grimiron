export type EquipmentSlot =
  | 'primary_weapon'
  | 'secondary_weapon'
  | 'armor'
  | 'helmet'
  | 'insignia'
  | 'tactical'
  | 'platform';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'relic';

export type ItemTier = 1 | 2 | 3 | 4 | 5;

export interface EquipmentCombatStats {
  bonusDamage?: number; // Flat bonus added to attack damage (e.g. +15)
  damageMultiplier?: number; // Percent bonus multiplier (e.g. 0.05 for +5%)
  critChanceBonus?: number; // Added crit chance (e.g. 0.03 for +3%)
  critMultiplierBonus?: number; // Added crit damage multiplier (e.g. 0.15 for +15%)
  defenseRating?: number; // Defense rating / armor soak
}

export interface EquipmentRequirements {
  minLevel?: number;
  minRankTier?: number;
  requiredCampaignChapter?: number;
  requiredAchievementId?: string;
  minRaidDifficulty?: 'standard' | 'challenging' | 'legendary';
}

export interface EquipmentDefinition {
  id: string;
  name: string;
  description: string;
  loreNote?: string;
  slot: EquipmentSlot;
  tier: ItemTier;
  rarity: ItemRarity;
  compatibleFactions: string[]; // Faction IDs or ['all']
  compatibleSubfactions?: string[];
  compatibleArchetypes?: string[];
  stats: EquipmentCombatStats;
  requirements: EquipmentRequirements;
  dropSources?: string[];
  iconName: string; // Ionicons glyph name
  iconColor?: string;
  isPlatform?: boolean; // E.g., Battlesuit, Terminator Armor, Mega-Armor, Dreadnought chassis
  changesArchetypeTo?: string; // If equipping this shifts archetype (e.g. 'crisis_pilot')
  isStarterItem?: boolean;
}

export interface InventoryItemRecord {
  id: string; // Unique instance ID
  characterId: string;
  itemId: string; // Reference to EquipmentDefinition.id
  acquiredAt: string; // ISO timestamp
  acquisitionSource: string; // e.g., 'starter_kit', 'weekly_raid_2026_W42', 'campaign_ch3'
  isEquipped: boolean;
  equippedSlot?: EquipmentSlot;
}

export type EquippedLoadout = Partial<Record<EquipmentSlot, string | null>>;

export interface FactionSlotConfig {
  factionId: string;
  allowedSlots: EquipmentSlot[];
  platformSlotLabel?: string; // e.g. "BATTLESUIT FRAME", "EXO-ARMOR CHASSIS", "POWER CHASSIS"
  defaultArchetype: string;
}

export interface LootDropEntry {
  itemId: string;
  dropChance: number; // 0.0 to 1.0 (1.0 = guaranteed)
  minRankTier?: number;
  minLevel?: number;
  isOneTime?: boolean;
}

export interface RaidLootTable {
  bossIdOrTier: string;
  drops: LootDropEntry[];
  guaranteedDropCount?: number;
}

export interface AggregatedEquipmentBonus {
  totalBonusDamage: number;
  totalDamageMultiplier: number; // e.g. 0.12 = +12%
  totalCritChanceBonus: number; // e.g. 0.06 = +6%
  totalCritMultiplierBonus: number; // e.g. 0.20 = +20%
  totalDefenseRating: number;
  equippedItemIds: string[];
}

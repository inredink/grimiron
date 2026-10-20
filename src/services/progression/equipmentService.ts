import {
  EquipmentDefinition,
  EquipmentSlot,
  EquippedLoadout,
  InventoryItemRecord,
  AggregatedEquipmentBonus,
} from '../../types/equipment';
import {
  EQUIPMENT_CATALOG,
  getEquipmentById,
  getStarterEquipmentForFaction,
} from '../../content/equipment/catalog';
import { getFactionSlotConfig } from '../../content/equipment/factionArchetypes';

export interface EquipmentStorageAdapter {
  getInventory(characterId: string): InventoryItemRecord[];
  saveInventoryItem(item: InventoryItemRecord): void;
  getLoadout(characterId: string): EquippedLoadout;
  saveLoadoutSlot(characterId: string, slot: EquipmentSlot, itemId: string | null): void;
  recordRaidLoot(raidCycleId: string, characterId: string, itemId: string): boolean;
  clearAll?(): void;
}

export class InMemoryEquipmentStorage implements EquipmentStorageAdapter {
  private inventory: Map<string, InventoryItemRecord[]> = new Map();
  private loadouts: Map<string, EquippedLoadout> = new Map();
  private raidLoot: Set<string> = new Set();

  getInventory(characterId: string): InventoryItemRecord[] {
    return this.inventory.get(characterId) || [];
  }

  saveInventoryItem(item: InventoryItemRecord): void {
    const list = this.getInventory(item.characterId);
    const existingIndex = list.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.push(item);
    }
    this.inventory.set(item.characterId, list);
  }

  getLoadout(characterId: string): EquippedLoadout {
    return { ...(this.loadouts.get(characterId) || {}) };
  }

  saveLoadoutSlot(characterId: string, slot: EquipmentSlot, itemId: string | null): void {
    const current = this.getLoadout(characterId);
    if (itemId === null) {
      delete current[slot];
    } else {
      current[slot] = itemId;
    }
    this.loadouts.set(characterId, current);

    // Update isEquipped flags on inventory items
    const list = this.getInventory(characterId);
    for (const item of list) {
      if (item.equippedSlot === slot && item.itemId !== itemId) {
        item.isEquipped = false;
        item.equippedSlot = undefined;
      }
      if (item.itemId === itemId && itemId !== null) {
        item.isEquipped = true;
        item.equippedSlot = slot;
      }
    }
    this.inventory.set(characterId, list);
  }

  recordRaidLoot(raidCycleId: string, characterId: string, itemId: string): boolean {
    const key = `${raidCycleId}_${characterId}_${itemId}`;
    if (this.raidLoot.has(key)) {
      return false;
    }
    this.raidLoot.add(key);
    return true;
  }

  clearAll(): void {
    this.inventory.clear();
    this.loadouts.clear();
    this.raidLoot.clear();
  }
}

let activeEquipmentStorage: EquipmentStorageAdapter = new InMemoryEquipmentStorage();

export function setEquipmentStorageAdapter(adapter: EquipmentStorageAdapter): void {
  activeEquipmentStorage = adapter;
}

export function getEquipmentStorageAdapter(): EquipmentStorageAdapter {
  return activeEquipmentStorage;
}

export function getCharacterInventory(characterId: string = 'char_main'): InventoryItemRecord[] {
  return activeEquipmentStorage.getInventory(characterId);
}

export function getCharacterLoadout(characterId: string = 'char_main'): EquippedLoadout {
  return activeEquipmentStorage.getLoadout(characterId);
}

/**
 * Checks eligibility of an item for a given character profile.
 */
export function isItemEquipEligible(
  item: EquipmentDefinition,
  characterFactionId: string,
  characterLevel: number = 1,
  characterRankTier: number = 1
): { eligible: boolean; reason?: string } {
  // 1. Faction compatibility
  const factionMatch =
    item.compatibleFactions.includes('all') ||
    item.compatibleFactions.includes(characterFactionId);
  if (!factionMatch) {
    return {
      eligible: false,
      reason: `Faction restricted: Not compatible with current faction.`,
    };
  }

  // 2. Character level check
  if (item.requirements.minLevel && characterLevel < item.requirements.minLevel) {
    return {
      eligible: false,
      reason: `Requires Character Level ${item.requirements.minLevel} (Current: ${characterLevel}).`,
    };
  }

  // 3. Faction rank check
  if (item.requirements.minRankTier && characterRankTier < item.requirements.minRankTier) {
    return {
      eligible: false,
      reason: `Requires Military Rank Tier ${item.requirements.minRankTier} (Current: ${characterRankTier}).`,
    };
  }

  return { eligible: true };
}

/**
 * Grants an inventory item to the character idempotently.
 */
export function grantInventoryItem(
  characterId: string = 'char_main',
  itemId: string,
  acquisitionSource: string = 'system_award'
): { success: boolean; item?: InventoryItemRecord; isDuplicate?: boolean } {
  const def = getEquipmentById(itemId);
  if (!def) {
    return { success: false };
  }

  const inventory = activeEquipmentStorage.getInventory(characterId);
  const existing = inventory.find((i) => i.itemId === itemId);
  if (existing) {
    return { success: true, isDuplicate: true, item: existing };
  }

  const now = new Date().toISOString();
  const newRecord: InventoryItemRecord = {
    id: `inv_${characterId}_${itemId}_${Date.now()}`,
    characterId,
    itemId,
    acquiredAt: now,
    acquisitionSource,
    isEquipped: false,
  };

  activeEquipmentStorage.saveInventoryItem(newRecord);
  return { success: true, isDuplicate: false, item: newRecord };
}

/**
 * Initializes starter equipment for a character based on their faction.
 */
export function initializeStarterEquipment(
  characterId: string = 'char_main',
  factionId: string = 'adeptus-astartes'
): void {
  const starters = getStarterEquipmentForFaction(factionId);

  for (const item of starters) {
    grantInventoryItem(characterId, item.id, 'starter_kit');
  }

  // Auto-equip starter items if slots are empty
  const currentLoadout = activeEquipmentStorage.getLoadout(characterId);
  for (const item of starters) {
    if (!currentLoadout[item.slot]) {
      equipItem(characterId, item.slot, item.id, 1, 1, factionId);
    }
  }
}

/**
 * Equips an item into a character's slot with validation.
 */
export function equipItem(
  characterId: string = 'char_main',
  slot: EquipmentSlot,
  itemId: string,
  characterLevel: number = 1,
  characterRankTier: number = 1,
  characterFactionId?: string
): { success: boolean; message: string } {
  const def = getEquipmentById(itemId);
  if (!def) {
    return { success: false, message: 'Equipment definition not found.' };
  }

  if (def.slot !== slot) {
    return { success: false, message: `Item cannot be equipped into ${slot.replace(/_/g, ' ')}.` };
  }

  // Verify ownership in inventory
  const inventory = activeEquipmentStorage.getInventory(characterId);
  const ownsItem = inventory.some((inv) => inv.itemId === itemId);
  if (!ownsItem) {
    return { success: false, message: 'You do not own this equipment in inventory.' };
  }

  // Verify faction and rank eligibility
  if (characterFactionId) {
    const check = isItemEquipEligible(def, characterFactionId, characterLevel, characterRankTier);
    if (!check.eligible) {
      return { success: false, message: check.reason || 'Not eligible to equip.' };
    }
  }

  activeEquipmentStorage.saveLoadoutSlot(characterId, slot, itemId);
  return { success: true, message: `Equipped ${def.name}.` };
}

/**
 * Unequips an item from a character's slot.
 */
export function unequipItem(
  characterId: string = 'char_main',
  slot: EquipmentSlot
): { success: boolean; message: string } {
  activeEquipmentStorage.saveLoadoutSlot(characterId, slot, null);
  return { success: true, message: `Unequipped ${slot.replace(/_/g, ' ')}.` };
}

/**
 * Retrieves all equipped EquipmentDefinitions for a character.
 */
export function getEquippedDefinitions(characterId: string = 'char_main'): EquipmentDefinition[] {
  const loadout = activeEquipmentStorage.getLoadout(characterId);
  const defs: EquipmentDefinition[] = [];

  for (const slot of Object.keys(loadout) as EquipmentSlot[]) {
    const itemId = loadout[slot];
    if (itemId) {
      const def = getEquipmentById(itemId);
      if (def) defs.push(def);
    }
  }

  return defs;
}

/**
 * Aggregates combat bonuses across all currently equipped gear.
 * Safeguards prevent runaway damage multipliers:
 * - Flat damage bonuses are summed (capped at max +150)
 * - Percentage damage multipliers are additive (capped at max +35% = 0.35)
 * - Crit chance bonuses are summed (capped at max +20% = 0.20)
 * - Crit multiplier bonuses are summed (capped at max +0.60)
 */
export function calculateEquipmentBonuses(
  equippedDefs: EquipmentDefinition[]
): AggregatedEquipmentBonus {
  let flatDmg = 0;
  let multDmg = 0;
  let critChance = 0;
  let critMult = 0;
  let defense = 0;
  const itemIds: string[] = [];

  for (const item of equippedDefs) {
    itemIds.push(item.id);
    if (item.stats.bonusDamage) flatDmg += item.stats.bonusDamage;
    if (item.stats.damageMultiplier) multDmg += item.stats.damageMultiplier;
    if (item.stats.critChanceBonus) critChance += item.stats.critChanceBonus;
    if (item.stats.critMultiplierBonus) critMult += item.stats.critMultiplierBonus;
    if (item.stats.defenseRating) defense += item.stats.defenseRating;
  }

  // Safe limits to prevent game-breaking damage inflation
  const cappedFlatDamage = Math.min(150, flatDmg);
  const cappedMultiplier = Math.min(0.35, multDmg);
  const cappedCritChance = Math.min(0.20, critChance);
  const cappedCritMult = Math.min(0.60, critMult);

  return {
    totalBonusDamage: cappedFlatDamage,
    totalDamageMultiplier: cappedMultiplier,
    totalCritChanceBonus: cappedCritChance,
    totalCritMultiplierBonus: cappedCritMult,
    totalDefenseRating: defense,
    equippedItemIds: itemIds,
  };
}

/**
 * Records a raid loot drop idempotently.
 */
export function recordRaidLootDrop(
  raidCycleId: string,
  characterId: string = 'char_main',
  itemId: string
): boolean {
  const recorded = activeEquipmentStorage.recordRaidLoot(raidCycleId, characterId, itemId);
  if (!recorded) {
    return false;
  }
  grantInventoryItem(characterId, itemId, `raid_loot_${raidCycleId}`);
  return true;
}

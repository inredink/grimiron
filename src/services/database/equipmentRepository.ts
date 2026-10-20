import { getDatabase } from './db';
import {
  EquipmentSlot,
  EquippedLoadout,
  InventoryItemRecord,
} from '../../types/equipment';
import {
  EquipmentStorageAdapter,
  setEquipmentStorageAdapter,
} from '../progression/equipmentService';

export const sqliteEquipmentStorage: EquipmentStorageAdapter = {
  getInventory: (characterId: string): InventoryItemRecord[] => {
    const db = getDatabase();
    try {
      const rows = db.getAllSync<{
        id: string;
        character_id: string;
        item_id: string;
        acquired_at: string;
        acquisition_source: string;
        is_equipped: number;
        equipped_slot: string | null;
      }>(
        `SELECT * FROM character_inventory WHERE character_id = ? ORDER BY acquired_at ASC`,
        [characterId]
      );

      return rows.map((r) => ({
        id: r.id,
        characterId: r.character_id,
        itemId: r.item_id,
        acquiredAt: r.acquired_at,
        acquisitionSource: r.acquisition_source,
        isEquipped: Boolean(r.is_equipped),
        equippedSlot: (r.equipped_slot as EquipmentSlot) || undefined,
      }));
    } catch (e) {
      console.error('Error fetching character inventory from SQLite:', e);
      return [];
    }
  },

  saveInventoryItem: (item: InventoryItemRecord): void => {
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO character_inventory (
        id, character_id, item_id, acquired_at, acquisition_source, is_equipped, equipped_slot
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.characterId,
        item.itemId,
        item.acquiredAt,
        item.acquisitionSource,
        item.isEquipped ? 1 : 0,
        item.equippedSlot || null,
      ]
    );
  },

  getLoadout: (characterId: string): EquippedLoadout => {
    const db = getDatabase();
    const loadout: EquippedLoadout = {};
    try {
      const rows = db.getAllSync<{
        slot: string;
        item_id: string | null;
      }>(
        `SELECT slot, item_id FROM character_equipment_loadout WHERE character_id = ?`,
        [characterId]
      );

      for (const r of rows) {
        if (r.item_id) {
          loadout[r.slot as EquipmentSlot] = r.item_id;
        }
      }
    } catch (e) {
      console.error('Error fetching character loadout from SQLite:', e);
    }
    return loadout;
  },

  saveLoadoutSlot: (
    characterId: string,
    slot: EquipmentSlot,
    itemId: string | null
  ): void => {
    const db = getDatabase();
    const now = new Date().toISOString();

    if (itemId === null) {
      db.runSync(
        `UPDATE character_inventory SET is_equipped = 0, equipped_slot = NULL 
         WHERE character_id = ? AND equipped_slot = ?`,
        [characterId, slot]
      );
      db.runSync(
        `DELETE FROM character_equipment_loadout WHERE character_id = ? AND slot = ?`,
        [characterId, slot]
      );
    } else {
      db.runSync(
        `UPDATE character_inventory SET is_equipped = 0, equipped_slot = NULL 
         WHERE character_id = ? AND equipped_slot = ?`,
        [characterId, slot]
      );
      db.runSync(
        `UPDATE character_inventory SET is_equipped = 1, equipped_slot = ? 
         WHERE character_id = ? AND item_id = ?`,
        [slot, characterId, itemId]
      );
      db.runSync(
        `INSERT INTO character_equipment_loadout (character_id, slot, item_id, equipped_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (character_id, slot) DO UPDATE SET
           item_id = excluded.item_id,
           equipped_at = excluded.equipped_at`,
        [characterId, slot, itemId, now]
      );
    }
  },

  recordRaidLoot: (
    raidCycleId: string,
    characterId: string,
    itemId: string
  ): boolean => {
    const db = getDatabase();
    const existing = db.getFirstSync<{ id: string }>(
      `SELECT id FROM raid_loot_history WHERE raid_cycle_id = ? AND character_id = ? AND item_id = ? LIMIT 1`,
      [raidCycleId, characterId, itemId]
    );
    if (existing) {
      return false;
    }

    const id = `loot_${raidCycleId}_${characterId}_${itemId}_${Date.now()}`;
    const now = new Date().toISOString();
    db.runSync(
      `INSERT INTO raid_loot_history (id, raid_cycle_id, user_id, character_id, item_id, rewarded_at)
       VALUES (?, ?, 'user_main', ?, ?, ?)`,
      [id, raidCycleId, characterId, itemId, now]
    );
    return true;
  },
};

export function initializeEquipmentSqliteStorage(): void {
  setEquipmentStorageAdapter(sqliteEquipmentStorage);
}

// Re-export core services
export * from '../progression/equipmentService';

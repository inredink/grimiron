import {
  CharacterRaidProgressionRecord,
  RaidTierId,
} from '../../types/raidProgression';
import {
  RaidProgressionStorageAdapter,
  setRaidProgressionStorageAdapter,
} from '../progression/raidProgressionEngine';
import { RAID_TIERS, getRaidTierById } from '../../content/raidTiers';
import { getDatabase } from './db';

export const sqliteRaidProgressionStorage: RaidProgressionStorageAdapter = {
  getProgression(characterId: string = 'char_main'): CharacterRaidProgressionRecord {
    try {
      const db = getDatabase();
      const summary = db.getFirstSync<{
        character_id: string;
        highest_tier_unlocked: string;
        total_victories: number;
        last_defeated_tier?: string;
        last_victory_at?: string;
      }>(
        'SELECT * FROM character_raid_summary WHERE character_id = ?',
        [characterId]
      );

      const tierRows = db.getAllSync<{
        raid_tier_id: string;
        victories_count: number;
      }>(
        'SELECT raid_tier_id, victories_count FROM character_raid_progression WHERE character_id = ?',
        [characterId]
      );

      const tierVictories: Partial<Record<RaidTierId, number>> = {};
      for (const row of tierRows) {
        tierVictories[row.raid_tier_id as RaidTierId] = row.victories_count;
      }

      if (summary) {
        return {
          characterId,
          highestTierUnlocked: (summary.highest_tier_unlocked as RaidTierId) || 'tier_1_initiation',
          tierVictories,
          totalRaidVictories: summary.total_victories || 0,
          lastDefeatedTier: summary.last_defeated_tier as RaidTierId | undefined,
          lastVictoryAt: summary.last_victory_at,
        };
      }

      // Initialize initial summary
      const now = new Date().toISOString();
      db.runSync(
        `INSERT OR IGNORE INTO character_raid_summary 
         (character_id, highest_tier_unlocked, total_victories, updated_at) 
         VALUES (?, 'tier_1_initiation', 0, ?)`,
        [characterId, now]
      );

      return {
        characterId,
        highestTierUnlocked: 'tier_1_initiation',
        tierVictories,
        totalRaidVictories: 0,
      };
    } catch (err) {
      console.warn('sqliteRaidProgressionStorage.getProgression error:', err);
      return {
        characterId,
        highestTierUnlocked: 'tier_1_initiation',
        tierVictories: {},
        totalRaidVictories: 0,
      };
    }
  },

  recordRaidVictory(
    tierId: RaidTierId,
    characterId: string = 'char_main'
  ): { newlyUnlockedTier?: RaidTierId; record: CharacterRaidProgressionRecord } {
    try {
      const db = getDatabase();
      const now = new Date().toISOString();

      // Upsert tier victory count
      db.runSync(
        `INSERT INTO character_raid_progression (character_id, raid_tier_id, victories_count, first_victory_at, last_victory_at)
         VALUES (?, ?, 1, ?, ?)
         ON CONFLICT(character_id, raid_tier_id) DO UPDATE SET
           victories_count = victories_count + 1,
           last_victory_at = excluded.last_victory_at`,
        [characterId, tierId, now, now]
      );

      const current = this.getProgression(characterId);
      const currentTierDef = getRaidTierById(tierId);
      const nextTierIndex = currentTierDef.tierNumber; // 1-based, index of next tier
      let newlyUnlockedTier: RaidTierId | undefined = undefined;

      let nextHighest = current.highestTierUnlocked;
      if (nextTierIndex < RAID_TIERS.length) {
        const candidateNextTier = RAID_TIERS[nextTierIndex];
        const highestCurrentDef = getRaidTierById(current.highestTierUnlocked);
        if (candidateNextTier.tierNumber > highestCurrentDef.tierNumber) {
          nextHighest = candidateNextTier.id;
          newlyUnlockedTier = candidateNextTier.id;
        }
      }

      // Update summary
      db.runSync(
        `INSERT INTO character_raid_summary 
         (character_id, highest_tier_unlocked, total_victories, last_defeated_tier, last_victory_at, updated_at)
         VALUES (?, ?, 1, ?, ?, ?)
         ON CONFLICT(character_id) DO UPDATE SET
           highest_tier_unlocked = ?,
           total_victories = total_victories + 1,
           last_defeated_tier = excluded.last_defeated_tier,
           last_victory_at = excluded.last_victory_at,
           updated_at = excluded.updated_at`,
        [characterId, nextHighest, tierId, now, now, nextHighest]
      );

      return {
        newlyUnlockedTier,
        record: this.getProgression(characterId),
      };
    } catch (err) {
      console.warn('sqliteRaidProgressionStorage.recordRaidVictory error:', err);
      return {
        record: this.getProgression(characterId),
      };
    }
  },

  getDefeatedTiers(characterId: string = 'char_main'): RaidTierId[] {
    try {
      const db = getDatabase();
      const rows = db.getAllSync<{ raid_tier_id: string }>(
        'SELECT raid_tier_id FROM character_raid_progression WHERE character_id = ? AND victories_count > 0',
        [characterId]
      );
      return rows.map((r) => r.raid_tier_id as RaidTierId);
    } catch {
      return [];
    }
  },
};

export function initializeRaidProgressionSqliteStorage(): void {
  setRaidProgressionStorageAdapter(sqliteRaidProgressionStorage);
}

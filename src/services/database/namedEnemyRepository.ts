import { isNamedEnemy, EnemyIdentityInput } from '../combat/namedEnemyClassifier';
import { RAID_TIERS } from '../../content/raidTiers';
import { ENEMY_CATALOG } from '../../content/combat/enemies';

declare const require: any;

export interface DefeatedNamedEnemy {
  enemyName: string;
  enemyId: string | null;
  factionId: string | null;
  enemyTitle: string | null;
  difficulty: string | null;
  baseHealth: number;
  slainAt: string;
  battleId: string | null;
}

export interface NamedEnemyTarget {
  id: string;
  name: string;
  title: string;
  faction: string;
  baseHealth: number;
  difficulty: string;
  loreDescription: string;
  isDefeated: boolean;
  slainAt?: string;
  battleId?: string;
}

export interface NamedEnemyStorageAdapter {
  recordDefeat(enemy: {
    name: string;
    id?: string;
    factionId?: string;
    title?: string;
    difficulty?: string;
    baseHealth?: number;
    battleId?: string;
  }): boolean;
  isDefeated(nameOrId: string): boolean;
  getDefeated(): DefeatedNamedEnemy[];
  cleanErroneous(): void;
}

// In-Memory Storage Adapter (used in unit tests)
const inMemorySlainEnemies = new Map<string, DefeatedNamedEnemy>();

export const inMemoryNamedEnemyStorage: NamedEnemyStorageAdapter = {
  recordDefeat: (enemy) => {
    if (!enemy || !enemy.name || enemy.name.trim().length === 0) return false;
    if (!isNamedEnemy({ id: enemy.id, name: enemy.name, difficulty: enemy.difficulty })) {
      return false;
    }
    const record: DefeatedNamedEnemy = {
      enemyName: enemy.name.trim(),
      enemyId: enemy.id || null,
      factionId: enemy.factionId || null,
      enemyTitle: enemy.title || null,
      difficulty: enemy.difficulty || null,
      baseHealth: enemy.baseHealth || 0,
      slainAt: new Date().toISOString(),
      battleId: enemy.battleId || null,
    };
    inMemorySlainEnemies.set(enemy.name.trim().toLowerCase(), record);
    if (enemy.id) inMemorySlainEnemies.set(enemy.id.trim().toLowerCase(), record);
    return true;
  },
  isDefeated: (nameOrId) => {
    if (!nameOrId || nameOrId.trim().length === 0) return false;
    return inMemorySlainEnemies.has(nameOrId.trim().toLowerCase());
  },
  getDefeated: () => {
    const unique = new Map<string, DefeatedNamedEnemy>();
    for (const val of inMemorySlainEnemies.values()) {
      unique.set(val.enemyName.toLowerCase(), val);
    }
    return Array.from(unique.values());
  },
  cleanErroneous: () => {
    for (const [key, val] of inMemorySlainEnemies.entries()) {
      if (!isNamedEnemy({ id: val.enemyId || undefined, name: val.enemyName })) {
        inMemorySlainEnemies.delete(key);
      }
    }
  },
};

// SQLite Storage Adapter (used in app runtime)
export const sqliteNamedEnemyStorage: NamedEnemyStorageAdapter = {
  recordDefeat: (enemy) => {
    if (!enemy || !enemy.name || enemy.name.trim().length === 0) return false;
    if (!isNamedEnemy({ id: enemy.id, name: enemy.name, difficulty: enemy.difficulty })) {
      return false;
    }
    try {
      const { getDatabase } = require('./db');
      const db = getDatabase();
      db.runSync(
        `INSERT OR REPLACE INTO slain_named_enemies (
          enemy_name, enemy_id, faction_id, enemy_title, difficulty, base_health, slain_at, battle_id
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
        [
          enemy.name.trim(),
          enemy.id || null,
          enemy.factionId || null,
          enemy.title || null,
          enemy.difficulty || null,
          enemy.baseHealth || 0,
          enemy.battleId || null,
        ]
      );
      return true;
    } catch (err) {
      console.warn('Error recording named enemy defeat:', err);
      return false;
    }
  },
  isDefeated: (nameOrId) => {
    if (!nameOrId || nameOrId.trim().length === 0) return false;
    try {
      const { getDatabase } = require('./db');
      const db = getDatabase();
      const trimmed = nameOrId.trim();
      const row = (db.getFirstSync(
        `SELECT COUNT(*) as count FROM slain_named_enemies 
         WHERE LOWER(enemy_name) = LOWER(?) OR (enemy_id IS NOT NULL AND LOWER(enemy_id) = LOWER(?))`,
        [trimmed, trimmed]
      ) as { count: number } | null);
      return (row?.count || 0) > 0;
    } catch {
      return false;
    }
  },
  getDefeated: () => {
    try {
      const { getDatabase } = require('./db');
      const db = getDatabase();
      const rows = (db.getAllSync('SELECT * FROM slain_named_enemies ORDER BY slain_at DESC') as Array<{
        enemy_name: string;
        enemy_id: string | null;
        faction_id: string | null;
        enemy_title: string | null;
        difficulty: string | null;
        base_health: number | null;
        slain_at: string;
        battle_id: string | null;
      }>) || [];

      return rows.map((r: {
        enemy_name: string;
        enemy_id: string | null;
        faction_id: string | null;
        enemy_title: string | null;
        difficulty: string | null;
        base_health: number | null;
        slain_at: string;
        battle_id: string | null;
      }) => ({
        enemyName: r.enemy_name,
        enemyId: r.enemy_id,
        factionId: r.faction_id,
        enemyTitle: r.enemy_title,
        difficulty: r.difficulty,
        baseHealth: r.base_health || 0,
        slainAt: r.slain_at,
        battleId: r.battle_id,
      }));
    } catch {
      return [];
    }
  },
  cleanErroneous: () => {
    try {
      const { getDatabase } = require('./db');
      const db = getDatabase();
      const rows = (db.getAllSync(
        'SELECT enemy_name, enemy_id FROM slain_named_enemies'
      ) as Array<{ enemy_name: string; enemy_id: string | null }>) || [];
      for (const r of rows) {
        if (!isNamedEnemy({ id: r.enemy_id || undefined, name: r.enemy_name })) {
          db.runSync('DELETE FROM slain_named_enemies WHERE enemy_name = ?', [r.enemy_name]);
        }
      }
    } catch (err) {
      console.warn('Error cleaning erroneous regular enemies from slain list:', err);
    }
  },
};

let activeNamedEnemyStorage: NamedEnemyStorageAdapter = sqliteNamedEnemyStorage;

export function setNamedEnemyStorageAdapter(adapter: NamedEnemyStorageAdapter): void {
  activeNamedEnemyStorage = adapter;
}

export function getNamedEnemyStorageAdapter(): NamedEnemyStorageAdapter {
  return activeNamedEnemyStorage;
}

/**
 * Records a defeated enemy into slain_named_enemies ONLY IF it is a genuine named enemy or raid boss.
 */
export function recordNamedEnemyDefeat(enemy: {
  name: string;
  id?: string;
  factionId?: string;
  title?: string;
  difficulty?: string;
  baseHealth?: number;
  battleId?: string;
}): boolean {
  return activeNamedEnemyStorage.recordDefeat(enemy);
}

/**
 * Checks whether a named enemy has been slain by the player.
 */
export function isNamedEnemyDefeated(nameOrId: string): boolean {
  return activeNamedEnemyStorage.isDefeated(nameOrId);
}

/**
 * Retrieves all defeated named enemies and raid bosses.
 */
export function getDefeatedNamedEnemies(): DefeatedNamedEnemy[] {
  return activeNamedEnemyStorage.getDefeated();
}

/**
 * Purges any regular/unnamed enemies that may have been erroneously inserted into slain_named_enemies.
 */
export function cleanErroneousRegularEnemiesFromSlainList(): void {
  activeNamedEnemyStorage.cleanErroneous();
}

/**
 * Retrieves a catalog of all known named enemies & raid bosses across the game,
 * annotated with whether this player has defeated them.
 */
export function getAllKnownNamedBossesWithStatus(): NamedEnemyTarget[] {
  const defeated = getDefeatedNamedEnemies();
  const defeatedByName = new Map<string, DefeatedNamedEnemy>();
  const defeatedById = new Map<string, DefeatedNamedEnemy>();

  for (const d of defeated) {
    defeatedByName.set(d.enemyName.toLowerCase(), d);
    if (d.enemyId) defeatedById.set(d.enemyId.toLowerCase(), d);
  }

  const targets: NamedEnemyTarget[] = [];

  // 1. Core catalog named bosses
  for (const enemy of ENEMY_CATALOG) {
    if (isNamedEnemy(enemy)) {
      const match =
        defeatedById.get(enemy.id.toLowerCase()) ||
        defeatedByName.get(enemy.name.toLowerCase());

      targets.push({
        id: enemy.id,
        name: enemy.name,
        title: enemy.title,
        faction: enemy.faction,
        baseHealth: enemy.baseHealth,
        difficulty: enemy.difficulty,
        loreDescription: enemy.loreDescription,
        isDefeated: Boolean(match),
        slainAt: match?.slainAt,
        battleId: match?.battleId || undefined,
      });
    }
  }

  // 2. Raid Tiers
  for (const tier of RAID_TIERS) {
    const tierId = tier.id;
    const tierName = `${tier.name} Commander`;
    const match =
      defeatedById.get(tierId.toLowerCase()) ||
      defeatedByName.get(tierName.toLowerCase());

    targets.push({
      id: tierId,
      name: tierName,
      title: `${tier.codeName} • Tier ${tier.tierNumber}`,
      faction: 'Raid Hostile',
      baseHealth: tier.soloHp,
      difficulty: 'boss',
      loreDescription: tier.loreBriefing,
      isDefeated: Boolean(match),
      slainAt: match?.slainAt,
      battleId: match?.battleId || undefined,
    });
  }

  // 3. Add any dynamically defeated raid bosses that were procedurally generated
  for (const d of defeated) {
    const alreadyIncluded = targets.some(
      (t) =>
        t.name.toLowerCase() === d.enemyName.toLowerCase() ||
        (d.enemyId && t.id.toLowerCase() === d.enemyId.toLowerCase())
    );

    if (!alreadyIncluded) {
      targets.push({
        id: d.enemyId || `slain_${d.enemyName}`,
        name: d.enemyName,
        title: d.enemyTitle || 'Warlord Nemesis',
        faction: d.factionId || 'Hostile',
        baseHealth: d.baseHealth || 0,
        difficulty: d.difficulty || 'boss',
        loreDescription: 'Vanquished high-value adversary recorded in the imperial kill ledger.',
        isDefeated: true,
        slainAt: d.slainAt,
        battleId: d.battleId || undefined,
      });
    }
  }

  return targets;
}

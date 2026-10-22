/**
 * Named Enemy Classifier & Identification Engine
 *
 * Enforces the strict distinction between unique Named Enemies / Raid Bosses
 * (which must never appear again once slain by a player) and Regular / Unnamed Enemies
 * (such as mob squads, broods, patrols, and regular infantry that spawn infinitely).
 */

export interface EnemyIdentityInput {
  id?: string;
  name?: string;
  difficulty?: string;
  isRaidBoss?: boolean;
  category?: string;
  encounterMode?: string;
  missionId?: string;
}

// Known regular unnamed enemies that MUST spawn continuously and NEVER be marked permanently dead
const REGULAR_ENEMY_IDS = new Set<string>([
  'enemy_chaos_cultist',
  'enemy_ork_boyz',
  'enemy_tyranid_warrior',
  'enemy_necron_immortals',
  'enemy_helbrute',
  'enemy_carnifex',
]);

// Collective group or unit nouns indicating regular unnamed squad / mob / horde
const REGULAR_COLLECTIVE_KEYWORDS = [
  'coven',
  'mob',
  'brood',
  'phalanx',
  'swarm',
  'squad',
  'platoon',
  'fireteam',
  'patrol',
  'scouts',
  'pack',
  'cell',
  'cultists',
  'cultist',
  'troopers',
  'infantry',
  'gargoyles',
  'hormagaunts',
  'termagants',
  'skirmishers',
  'sentinels',
  'outriders',
  'vanguard',
  'raiders',
  'warriors',
  'immortals',
  'carnifex',
  'helbrute',
  'cohort',
];

// Specific unique named enemies in core catalogs
const UNIQUE_NAMED_ENEMY_IDS = new Set<string>([
  'enemy_ork_warboss', // Warboss Skullkrakka 'Da Immense'
  'enemy_daemon_prince', // Azgathor the Desolator
]);

/**
 * Evaluates whether an enemy is a unique Named Enemy or Raid Boss.
 *
 * Rules:
 * 1. Raid bosses (raid tiers, weekly procedural raid bosses, academy bosses) are ALWAYS named bosses.
 * 2. Unique named warlords (Skullkrakka, Azgathor) are ALWAYS named bosses.
 * 3. Regular mobs, squads, and collective broods are NEVER named enemies.
 * 4. Regular workout day enemies and Warfront encounter templates are NEVER named raid enemies.
 */
export function isNamedEnemy(enemy: EnemyIdentityInput): boolean {
  if (!enemy) return false;

  const id = (enemy.id || '').trim().toLowerCase();
  const name = (enemy.name || '').trim().toLowerCase();

  // 1. Explicit regular unnamed enemies
  if (REGULAR_ENEMY_IDS.has(id)) {
    return false;
  }

  // 2. Warfront encounter templates are regular workout missions, NOT raid bosses
  if (id.startsWith('enc_') || id.startsWith('mission_enc_') || id.startsWith('crusade_')) {
    return false;
  }

  // 3. Raid Tiers (tier_1 through tier_7) are raid bosses
  if (id.startsWith('tier_') || id.startsWith('raid_tier_')) {
    return true;
  }

  // 4. Procedural weekly raid bosses (bossKey starts with wb_, or isRaidBoss flag set)
  if (
    enemy.isRaidBoss ||
    id.startsWith('raid_boss_') ||
    id.startsWith('boss_') ||
    id.startsWith('wb_') ||
    id.startsWith('raid_') ||
    enemy.encounterMode === 'weekly_raid' ||
    Boolean(enemy.missionId && enemy.missionId.startsWith('raid_'))
  ) {
    return true;
  }

  // 5. Explicit unique named enemies
  if (UNIQUE_NAMED_ENEMY_IDS.has(id)) {
    return true;
  }

  // 6. Explicit collective squad / mob keywords in name (for non-raid hostiles)
  for (const keyword of REGULAR_COLLECTIVE_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(name) || regex.test(id)) {
      return false;
    }
  }

  // 7. Difficulty-based checks: patrol, skirmish, incursion without boss flag are regular
  if (enemy.difficulty === 'patrol' || enemy.difficulty === 'skirmish' || enemy.difficulty === 'incursion') {
    return false;
  }

  // 8. Boss or Crusade difficulty only if explicitly flagged as raid boss or weekly raid
  if ((enemy.difficulty === 'boss' || enemy.difficulty === 'crusade') && (enemy.isRaidBoss || enemy.encounterMode === 'weekly_raid')) {
    return true;
  }

  return false;
}

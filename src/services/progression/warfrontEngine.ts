import {
  DailyRotationRecord,
  WeeklyRaidCycle,
  RaidSpawnDay,
  EncounterTemplate,
  GeneratedBossIdentity,
  BossPhaseDefinition,
  BossDifficultyTier,
} from '../../types/warfront';
import {
  BattleRecord,
  BattleSnapshot,
  BattleOutcome,
  BattleParticipantContribution,
  BattleTimelineEvent,
} from '../../types/battleHistory';
import {
  allEncounterTemplates,
  getEncounterById,
} from '../../content/encounters/catalog';
import {
  generateProceduralBoss,
  createDeterministicPrng,
} from './bossGenerator';
import { evaluateRaidBossLoot } from './raidLootEngine';
import { EquipmentDefinition } from '../../types/equipment';
import { RaidTierId } from '../../types/raidProgression';
import { getRaidTierById } from '../../content/raidTiers';

/**
 * Pluggable Storage Adapter for Warfront.
 * Defaults to in-memory storage (ideal for testing in Node.js environments),
 * and can be swapped for SQLite in React Native runtime.
 */
export interface WarfrontStorageAdapter {
  getDailyRotation(dateStr: string): DailyRotationRecord | null;
  saveDailyRotation(record: DailyRotationRecord): void;
  getRecentEncounterIds(cutoffDateStr: string): string[];
  recordRecentEncounters(ids: string[], dateStr: string): void;
  getWeeklyRaid(cycleId: string): WeeklyRaidCycle | null;
  saveWeeklyRaid(raid: WeeklyRaidCycle): void;
  getAllWeeklyRaids(): WeeklyRaidCycle[];
  getPreferredSpawnDay(): RaidSpawnDay;
  getRecentRaidBossKeys?(limit?: number): string[];
  recordRecentRaidBoss?(
    cycleId: string,
    bossKey: string,
    archetypeId: string,
    factionId: string,
    bossName: string
  ): void;
  getSlainEnemyNames?(): string[];
  recordSlainEnemy?(
    enemyName: string,
    enemyId?: string,
    factionId?: string,
    battleId?: string
  ): void;
  getEscapedEnemyNames?(): string[];
}

// In-Memory Storage Adapter (Default)
const inMemoryDailyRotations = new Map<string, DailyRotationRecord>();
const inMemoryRecentEncounters = new Map<string, string>(); // encounterId -> selectedDate
const inMemoryWeeklyRaids = new Map<string, WeeklyRaidCycle>();
const inMemoryRecentBossKeys: string[] = [];
const inMemorySlainEnemies = new Set<string>();
const inMemoryEscapedEnemies = new Set<string>();
let inMemoryPreferredSpawnDay: RaidSpawnDay = 'saturday';

export const inMemoryWarfrontStorage: WarfrontStorageAdapter = {
  getDailyRotation: (dateStr) => inMemoryDailyRotations.get(dateStr) || null,
  saveDailyRotation: (record) => {
    inMemoryDailyRotations.set(record.rotationDate, { ...record });
  },
  getRecentEncounterIds: (cutoffDateStr) => {
    const results: string[] = [];
    for (const [id, date] of inMemoryRecentEncounters.entries()) {
      if (date >= cutoffDateStr) results.push(id);
    }
    return results;
  },
  recordRecentEncounters: (ids, dateStr) => {
    for (const id of ids) {
      inMemoryRecentEncounters.set(id, dateStr);
    }
  },
  getWeeklyRaid: (cycleId) => inMemoryWeeklyRaids.get(cycleId) || null,
  saveWeeklyRaid: (raid) => {
    inMemoryWeeklyRaids.set(raid.cycleId, JSON.parse(JSON.stringify(raid)));
  },
  getAllWeeklyRaids: () => Array.from(inMemoryWeeklyRaids.values()),
  getPreferredSpawnDay: () => inMemoryPreferredSpawnDay,
  getRecentRaidBossKeys: (limit = 12) => inMemoryRecentBossKeys.slice(-limit),
  recordRecentRaidBoss: (_cycleId, bossKey) => {
    inMemoryRecentBossKeys.push(bossKey);
  },
  getSlainEnemyNames: () => Array.from(inMemorySlainEnemies),
  recordSlainEnemy: (enemyName) => {
    inMemorySlainEnemies.add(enemyName);
    inMemoryEscapedEnemies.delete(enemyName);
  },
  getEscapedEnemyNames: () => {
    const escapedFromRaids: string[] = [];
    for (const raid of inMemoryWeeklyRaids.values()) {
      if (raid.status === 'escaped' && !inMemorySlainEnemies.has(raid.boss.name)) {
        escapedFromRaids.push(raid.boss.name);
      }
    }
    const combined = new Set([...Array.from(inMemoryEscapedEnemies), ...escapedFromRaids]);
    return Array.from(combined).filter((e) => !inMemorySlainEnemies.has(e));
  },
};

let activeStorageAdapter: WarfrontStorageAdapter = inMemoryWarfrontStorage;

export function setWarfrontStorageAdapter(adapter: WarfrontStorageAdapter): void {
  activeStorageAdapter = adapter;
}

export function getWarfrontStorageAdapter(): WarfrontStorageAdapter {
  return activeStorageAdapter;
}

/**
 * Returns today's calendar date in standard YYYY-MM-DD format.
 */
export function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Pure generator for 3 daily encounters from date seed and pool.
 * Named enemies that have been defeated/slain are excluded from generation.
 * Enemies that escaped remain eligible in the pool.
 */
export function generateDailyRotationFromPool(
  targetDate: string,
  recentIds: string[] = [],
  catalog: EncounterTemplate[] = allEncounterTemplates,
  slainEnemyNames: string[] = []
): DailyRotationRecord {
  const slainSet = new Set(slainEnemyNames.map((n) => n.trim().toLowerCase()));

  // Filter pool excluding recent encounters and named enemies that have been slain
  let pool = catalog.filter((enc) => {
    if (recentIds.includes(enc.id)) return false;
    if (enc.enemyName && slainSet.has(enc.enemyName.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (pool.length < 3) {
    pool = catalog.filter((enc) => !enc.enemyName || !slainSet.has(enc.enemyName.toLowerCase()));
    if (pool.length < 3) {
      pool = [...catalog];
    }
  }

  // Seeded deterministic PRNG using target date string
  const prng = createDeterministicPrng(`daily_${targetDate}`);

  // Shuffle pool deterministically
  const shuffled = [...pool].sort(() => prng() - 0.5);

  // Pick 3 distinct encounters, favoring distinct categories
  const selected: EncounterTemplate[] = [];
  const chosenCategories = new Set<string>();

  for (const candidate of shuffled) {
    if (!chosenCategories.has(candidate.category)) {
      selected.push(candidate);
      chosenCategories.add(candidate.category);
      if (selected.length === 3) break;
    }
  }

  // If could not fill 3 with distinct categories, fill remainder
  if (selected.length < 3) {
    for (const candidate of shuffled) {
      if (!selected.some((s) => s.id === candidate.id)) {
        selected.push(candidate);
        if (selected.length === 3) break;
      }
    }
  }

  const selectedIds = selected.map((s) => s.id);
  return {
    rotationDate: targetDate,
    offeredEncounterIds: selectedIds,
    completedEncounterIds: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Retrieves the stable 3-encounter daily offer board for the given date.
 *
 * Guarantees:
 * - Refresh-Proof: Persisted to storage; restarting or re-rendering NEVER rerolls today's board.
 * - History Buffer: Excludes templates offered in the last 14 days where possible.
 * - Slain Enemy Exclusion: Slain named adversaries are permanently excluded.
 * - Escaped Creature Retention: Adversaries that escaped are retained as valid targets.
 * - Deterministic: If generated anew, selection is strictly seeded by date string.
 */
export function getOrCreateDailyRotation(
  targetDate: string = getTodayDateString()
): DailyRotationRecord {
  const existing = activeStorageAdapter.getDailyRotation(targetDate);
  if (existing) {
    return existing;
  }

  // 14-day history buffer to prevent repetition
  const targetTime = new Date(targetDate).getTime();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const cutoffDateStr = getTodayDateString(new Date(targetTime - fourteenDaysMs));
  const recentIds = activeStorageAdapter.getRecentEncounterIds(cutoffDateStr);
  const slainEnemyNames = activeStorageAdapter.getSlainEnemyNames
    ? activeStorageAdapter.getSlainEnemyNames()
    : [];

  const newRecord = generateDailyRotationFromPool(
    targetDate,
    recentIds,
    allEncounterTemplates,
    slainEnemyNames
  );

  activeStorageAdapter.saveDailyRotation(newRecord);
  activeStorageAdapter.recordRecentEncounters(newRecord.offeredEncounterIds, targetDate);

  return newRecord;
}

/**
 * Marks a daily encounter as completed in the rotation record.
 */
export function completeDailyEncounter(
  dateStr: string,
  encounterId: string
): DailyRotationRecord | null {
  const record = activeStorageAdapter.getDailyRotation(dateStr);
  if (!record) return null;

  if (!record.completedEncounterIds.includes(encounterId)) {
    record.completedEncounterIds.push(encounterId);
    record.updatedAt = new Date().toISOString();
    activeStorageAdapter.saveDailyRotation(record);
  }

  return record;
}

/**
 * Computes weekly cycle timing and cycleId based on preferred spawn day.
 * Default spawn day is Saturday (with Friday supported as an option or via settings).
 * Saturday spawn: Saturday 00:00:00 to next Saturday 00:00:00.
 * Friday spawn: Friday 00:00:00 to next Friday 00:00:00.
 */
export function calculateWeeklyCycleTiming(
  now: Date = new Date(),
  spawnDay: RaidSpawnDay = 'saturday'
): { cycleId: string; startedAt: string; expiresAt: string } {
  const dayTarget = spawnDay === 'friday' ? 5 : 6; // 5 = Friday, 6 = Saturday
  const currentDay = now.getDay();

  let daysSinceSpawn = (currentDay - dayTarget + 7) % 7;
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - daysSinceSpawn);
  startDate.setHours(0, 0, 0, 0);

  const expireDate = new Date(startDate);
  expireDate.setDate(startDate.getDate() + 7);

  // Compute ISO Week number for cycle ID
  const d = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  const cycleId = `${d.getUTCFullYear()}_W${String(weekNo).padStart(2, '0')}_${spawnDay}`;

  return {
    cycleId,
    startedAt: startDate.toISOString(),
    expiresAt: expireDate.toISOString(),
  };
}

/**
 * Pure helper to calculate the current boss phase based on health thresholds.
 * Phase 1: 100% -> 67%
 * Phase 2: 66% -> 34%
 * Phase 3: 33% -> 0%
 */
export function calculateBossPhase(
  currentHp: number,
  maxHp: number,
  phases: BossPhaseDefinition[]
): BossPhaseDefinition {
  if (!phases || phases.length === 0) {
    return {
      phaseNumber: 1,
      title: 'Phase I: Battle Readiness',
      hpThresholdPercent: 100,
      description: 'Standard combat posture.',
      visualColor: '#4A148C',
      taunt: 'Prepare yourself for war.',
    };
  }

  const hpPercent = maxHp > 0 ? (currentHp / maxHp) * 100 : 0;
  if (hpPercent <= 33 && phases.length >= 3) {
    return phases[2];
  }
  if (hpPercent <= 66 && phases.length >= 2) {
    return phases[1];
  }
  return phases[0];
}

/**
 * Returns the active combat phase definition for a given weekly raid.
 */
export function getCurrentBossPhase(raid: WeeklyRaidCycle): BossPhaseDefinition {
  return calculateBossPhase(raid.currentHp, raid.maxHp, raid.boss.phases);
}

/**
 * Creates an immutable BattleRecord snapshot from a completed or expired weekly raid.
 */
export function createBattleRecordFromWeeklyRaid(raid: WeeklyRaidCycle): BattleRecord {
  const isDefeated = raid.status === 'defeated';
  const outcome: BattleOutcome = isDefeated ? 'victory' : 'escaped';
  const totalDamageDealt = Math.max(0, raid.maxHp - raid.currentHp);

  const participantsList: BattleParticipantContribution[] = Object.values(raid.contributions).map(
    (c) => {
      const share =
        totalDamageDealt > 0 ? Math.round((c.damage / totalDamageDealt) * 1000) / 10 : 0;
      return {
        userId: c.userId,
        callsign: c.callsign,
        factionId: c.factionId,
        attacksCount: c.attacksCount,
        damageDealt: c.damage,
        damageSharePercent: share,
        workoutsAttributed: c.workoutsCount,
        setsAttributed: c.attacksCount,
      };
    }
  );

  const timeline: BattleTimelineEvent[] = [
    {
      timestamp: raid.startedAt,
      eventType: 'battle_started',
      actorName: 'Warfront Command',
      description: `Weekly Crusade Raid initiated against ${raid.boss.name}, ${raid.boss.title}.`,
    },
  ];

  if (isDefeated) {
    timeline.push({
      timestamp: raid.updatedAt,
      eventType: 'enemy_slain',
      actorName: 'Strike Team',
      description: `${raid.boss.name} has been vanquished. "${raid.boss.defeatQuote}"`,
    });
  } else if (raid.status === 'escaped') {
    timeline.push({
      timestamp: raid.updatedAt,
      eventType: 'tactical_retreat',
      actorName: raid.boss.name,
      description: `${raid.boss.name} broke orbit and escaped the sector as the weekly cycle concluded.`,
    });
  }

  const snapshot: BattleSnapshot = {
    enemyDescription: raid.boss.loreDescription,
    enemyGlyph: raid.boss.glyph,
    enemyFaction: raid.boss.factionName,
    initialHealth: raid.maxHp,
    finalHealth: raid.currentHp,
    timeline,
    participants: participantsList,
    userAttacks: [],
    linkedWorkoutIds: [],
    rewards: {
      baseXpEarned: 0,
      gloryBonusXp: isDefeated ? 500 : 0,
      totalXpEarned: isDefeated ? 500 : 0,
      achievementsUnlocked: isDefeated ? ['ach_weekly_raid_slayer'] : [],
    },
    afterActionReportSummary: isDefeated
      ? `Glorious victory! ${raid.boss.name} was defeated after suffering ${totalDamageDealt} total damage.`
      : `Raid cycle concluded. ${raid.boss.name} survived with ${raid.currentHp}/${raid.maxHp} HP remaining and escaped the sector.`,
  };

  return {
    id: `bh_raid_${raid.cycleId}`,
    encounterMode: 'weekly_raid',
    missionTitle: `Weekly Raid: ${raid.boss.title}`,
    enemyId: raid.boss.bossKey,
    enemyName: raid.boss.name,
    enemyFaction: raid.boss.factionName,
    enemyDifficulty:
      raid.boss.difficultyTier === 'legendary'
        ? 'crusade'
        : raid.boss.difficultyTier === 'challenging'
        ? 'boss'
        : 'incursion',
    enemyMaxHp: raid.maxHp,
    enemyRemainingHp: raid.currentHp,
    outcome,
    totalDamage: totalDamageDealt,
    totalAttacks: Object.values(raid.contributions).reduce((sum, c) => sum + c.attacksCount, 0),
    participantCount: Math.max(1, Object.keys(raid.contributions).length),
    squadId: raid.squadId,
    squadName: raid.squadName,
    startedAt: raid.startedAt,
    completedAt: raid.updatedAt,
    durationSeconds: Math.max(
      0,
      Math.round((new Date(raid.updatedAt).getTime() - new Date(raid.startedAt).getTime()) / 1000)
    ),
    xpEarned: isDefeated ? 500 : 0,
    snapshot,
    createdAt: raid.updatedAt,
  };
}

declare const require: any;

/**
 * Persists an archived battle record to Battle History (with SQLite or memory fallback).
 */
export function archiveWeeklyRaidToBattleHistory(raid: WeeklyRaidCycle): BattleRecord {
  const record = createBattleRecordFromWeeklyRaid(raid);
  try {
    const { recordBattleHistory } = require('../database/battleHistoryRepository');
    if (typeof recordBattleHistory === 'function') {
      recordBattleHistory(record);
    }
  } catch {
    // Graceful fallback for non-SQLite testing environments
  }
  return record;
}

/**
 * Archives any expired weekly raids cleanly as 'escaped' without false defeats.
 */
export function reconcileExpiredRaids(now: Date = new Date()): void {
  const raids = activeStorageAdapter.getAllWeeklyRaids();
  const nowMs = now.getTime();

  for (const raid of raids) {
    if (raid.status === 'active') {
      const expireMs = new Date(raid.expiresAt).getTime();
      if (nowMs >= expireMs) {
        raid.status = 'escaped';
        raid.updatedAt = now.toISOString();
        activeStorageAdapter.saveWeeklyRaid(raid);
        archiveWeeklyRaidToBattleHistory(raid);
      }
    }
  }
}

/**
 * Retrieves or initializes the active Weekly Raid Boss cycle.
 *
 * Guarantees:
 * - Saturday default spawn day.
 * - Future-cycle policy: Changing preferred spawn day applies to future cycles without disrupting an active week.
 * - 12-Cycle Duplicate Avoidance: Boss identities and archetypes avoid repeating recently rolled bosses.
 * - Refresh-proof deterministic PRNG seeded by cycle ID.
 */
export function getOrCreateWeeklyRaid(options?: {
  now?: Date;
  squadId?: string;
  squadName?: string;
  preferredSpawnDay?: RaidSpawnDay;
  targetFactionId?: string;
  forceDifficulty?: BossDifficultyTier;
}): WeeklyRaidCycle {
  const now = options?.now || new Date();
  const spawnDay = options?.preferredSpawnDay || activeStorageAdapter.getPreferredSpawnDay();

  // Cleanly archive previous unresolved cycles as 'escaped'
  reconcileExpiredRaids(now);

  const scope: 'squad' | 'individual' = options?.squadId ? 'squad' : 'individual';

  // Future-Cycle Policy: If there is already an active raid of this scope that hasn't expired, preserve it
  const allRaids = activeStorageAdapter.getAllWeeklyRaids();
  const activeExisting = allRaids.find((r) => {
    if (r.status !== 'active') return false;
    if (r.scope !== scope) return false;
    if (scope === 'squad' && r.squadId !== options?.squadId) return false;
    const expireMs = new Date(r.expiresAt).getTime();
    return now.getTime() < expireMs;
  });

  if (activeExisting) {
    return activeExisting;
  }

  const timing = calculateWeeklyCycleTiming(now, spawnDay);
  const fullCycleKey = options?.squadId
    ? `${timing.cycleId}_${options.squadId}`
    : `${timing.cycleId}_solo`;

  const existing = activeStorageAdapter.getWeeklyRaid(fullCycleKey);
  if (existing) {
    return existing;
  }

  // 12-Cycle Duplicate Avoidance buffer
  const recentKeys = activeStorageAdapter.getRecentRaidBossKeys
    ? activeStorageAdapter.getRecentRaidBossKeys(12)
    : [];

  const slainEnemyNames = activeStorageAdapter.getSlainEnemyNames
    ? activeStorageAdapter.getSlainEnemyNames()
    : [];
  const escapedEnemyNames = activeStorageAdapter.getEscapedEnemyNames
    ? activeStorageAdapter.getEscapedEnemyNames()
    : [];

  // Generate boss procedurally from cycle timing, recent history, and immersion filters
  const boss = generateProceduralBoss(timing.cycleId, {
    targetFactionId: options?.targetFactionId,
    recentBossKeys: recentKeys,
    forceDifficulty: options?.forceDifficulty,
    slainEnemyNames,
    escapedEnemyNames,
  });

  if (activeStorageAdapter.recordRecentRaidBoss) {
    activeStorageAdapter.recordRecentRaidBoss(
      timing.cycleId,
      boss.bossKey,
      boss.archetype,
      boss.factionId,
      boss.name
    );
  }

  // Health scaling calibrated for demanding workouts (e.g. 10x10 + 10x5 sets dealing 5,000+ damage):
  // Individual (6,500 HP standard) vs Squad (18,000 HP standard)
  const tierMultiplier =
    options?.forceDifficulty === 'legendary'
      ? 1.4
      : options?.forceDifficulty === 'challenging'
      ? 1.2
      : 1.0;
  const baseHp = scope === 'squad' ? 18000 : 6500;
  const maxHp = Math.round(baseHp * tierMultiplier);

  const timezone =
    typeof Intl !== 'undefined' && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      : 'UTC';

  const newRaid: WeeklyRaidCycle = {
    cycleId: fullCycleKey,
    scope,
    squadId: options?.squadId,
    squadName: options?.squadName,
    boss,
    maxHp,
    currentHp: maxHp,
    status: 'active',
    spawnDay,
    startedAt: timing.startedAt,
    expiresAt: timing.expiresAt,
    timezone,
    raidAvailability: 'available',
    isRewardClaimed: false,
    contributions: {},
    updatedAt: now.toISOString(),
    isReturningNemesis: boss.isReturningNemesis,
  };

  activeStorageAdapter.saveWeeklyRaid(newRaid);
  return newRaid;
}

/**
 * Idempotently applies combat damage to the active weekly raid boss.
 * Automatically transitions boss phases, marks boss permanently slain on victory,
 * and archives to Battle History.
 */
export function applyDamageToWeeklyRaid(
  cycleId: string,
  userId: string,
  callsign: string,
  factionId: string,
  damage: number,
  setsCount: number
): WeeklyRaidCycle | null {
  const raid = activeStorageAdapter.getWeeklyRaid(cycleId);
  if (!raid || raid.status !== 'active') return raid;

  const damageToApply = Math.max(0, damage);
  raid.currentHp = Math.max(0, raid.currentHp - damageToApply);

  if (raid.currentHp === 0) {
    raid.status = 'defeated';
    if (activeStorageAdapter.recordSlainEnemy) {
      activeStorageAdapter.recordSlainEnemy(
        raid.boss.name,
        raid.boss.bossKey,
        raid.boss.factionId,
        raid.cycleId
      );
    }
  }

  // Update participant contributions
  if (!raid.contributions[userId]) {
    raid.contributions[userId] = {
      userId,
      callsign,
      factionId,
      damage: 0,
      attacksCount: 0,
      workoutsCount: 0,
      lastContributedAt: new Date().toISOString(),
    };
  }

  const p = raid.contributions[userId];
  p.damage += damageToApply;
  p.attacksCount += setsCount;
  p.workoutsCount += 1;
  p.lastContributedAt = new Date().toISOString();

  raid.updatedAt = new Date().toISOString();

  if (raid.status === 'defeated') {
    archiveWeeklyRaidToBattleHistory(raid);
  }

  activeStorageAdapter.saveWeeklyRaid(raid);
  return raid;
}

/**
 * Checks whether a named enemy has been permanently slain/defeated.
 */
export function isEnemySlain(enemyName: string): boolean {
  const slainNames = activeStorageAdapter.getSlainEnemyNames
    ? activeStorageAdapter.getSlainEnemyNames()
    : [];
  return slainNames.some((n) => n.trim().toLowerCase() === enemyName.trim().toLowerCase());
}

/**
 * Checks whether an enemy is currently recorded as escaped (eligible to return).
 */
export function isEnemyEscaped(enemyName: string): boolean {
  const escapedNames = activeStorageAdapter.getEscapedEnemyNames
    ? activeStorageAdapter.getEscapedEnemyNames()
    : [];
  return escapedNames.some((n) => n.trim().toLowerCase() === enemyName.trim().toLowerCase());
}

export interface WeeklyRaidClaimResult {
  success: boolean;
  gloryXpAwarded: number;
  message: string;
  awardedItem?: EquipmentDefinition;
}

/**
 * Claims weekly raid spoils if defeated and not previously claimed.
 * Distributes eligible, faction-appropriate equipment drops from raid loot tables.
 */
export function claimWeeklyRaidRewards(
  cycleId: string,
  characterFactionId?: string,
  characterLevel: number = 1,
  characterRankTier: number = 1,
  characterId: string = 'char_main',
  raidTierId?: RaidTierId
): WeeklyRaidClaimResult {
  const raid = activeStorageAdapter.getWeeklyRaid(cycleId);
  if (!raid) {
    return { success: false, gloryXpAwarded: 0, message: 'Raid cycle not found.' };
  }

  if (raid.status !== 'defeated') {
    return {
      success: false,
      gloryXpAwarded: 0,
      message: 'Weekly raid boss has not yet been defeated.',
    };
  }

  if (raid.isRewardClaimed) {
    return {
      success: false,
      gloryXpAwarded: 0,
      message: 'Raid rewards have already been claimed for this cycle.',
    };
  }

  raid.isRewardClaimed = true;
  raid.updatedAt = new Date().toISOString();
  activeStorageAdapter.saveWeeklyRaid(raid);

  const tierDef = raidTierId ? getRaidTierById(raidTierId) : null;
  const gloryXpAwarded = tierDef ? tierDef.gloryXpReward : 500;
  let lootMsg = '';
  let awardedItem: EquipmentDefinition | undefined;

  if (characterFactionId) {
    try {
      const lootResult = evaluateRaidBossLoot(
        cycleId,
        raidTierId ? { ...raid.boss, raidTierId } : raid.boss,
        characterFactionId,
        characterLevel,
        characterRankTier,
        characterId
      );
      if (lootResult.awardedItem) {
        awardedItem = lootResult.awardedItem;
        lootMsg = ` ${lootResult.message}`;
      }
    } catch (e) {
      console.warn('Loot evaluation error:', e);
    }
  }

  return {
    success: true,
    gloryXpAwarded,
    message: `Victory! Neutralized ${raid.boss.name}. Claimed +${gloryXpAwarded} Glory XP.${lootMsg}`,
    awardedItem,
  };
}

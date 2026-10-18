import {
  DailyRotationRecord,
  WeeklyRaidCycle,
  RaidSpawnDay,
  EncounterTemplate,
  GeneratedBossIdentity,
} from '../../types/warfront';
import {
  allEncounterTemplates,
  getEncounterById,
} from '../../content/encounters/catalog';
import {
  generateProceduralBoss,
  createDeterministicPrng,
} from './bossGenerator';

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
}

// In-Memory Storage Adapter (Default)
const inMemoryDailyRotations = new Map<string, DailyRotationRecord>();
const inMemoryRecentEncounters = new Map<string, string>(); // encounterId -> selectedDate
const inMemoryWeeklyRaids = new Map<string, WeeklyRaidCycle>();
let inMemoryPreferredSpawnDay: RaidSpawnDay = 'friday';

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
 */
export function generateDailyRotationFromPool(
  targetDate: string,
  recentIds: string[] = [],
  catalog: EncounterTemplate[] = allEncounterTemplates
): DailyRotationRecord {
  let pool = catalog.filter((enc) => !recentIds.includes(enc.id));
  if (pool.length < 3) {
    pool = [...catalog];
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

  const newRecord = generateDailyRotationFromPool(targetDate, recentIds);

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
 * Friday spawn: Friday 00:00:00 to next Friday 00:00:00.
 * Saturday spawn: Saturday 00:00:00 to next Saturday 00:00:00.
 */
export function calculateWeeklyCycleTiming(
  now: Date = new Date(),
  spawnDay: RaidSpawnDay = 'friday'
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
      }
    }
  }
}

/**
 * Retrieves or initializes the active Weekly Raid Boss cycle.
 */
export function getOrCreateWeeklyRaid(options?: {
  now?: Date;
  squadId?: string;
  squadName?: string;
  preferredSpawnDay?: RaidSpawnDay;
  targetFactionId?: string;
}): WeeklyRaidCycle {
  const now = options?.now || new Date();
  const spawnDay = options?.preferredSpawnDay || activeStorageAdapter.getPreferredSpawnDay();

  // Cleanly archive previous unresolved cycles as 'escaped'
  reconcileExpiredRaids(now);

  const timing = calculateWeeklyCycleTiming(now, spawnDay);
  const scope: 'squad' | 'individual' = options?.squadId ? 'squad' : 'individual';
  const fullCycleKey = options?.squadId
    ? `${timing.cycleId}_${options.squadId}`
    : `${timing.cycleId}_solo`;

  const existing = activeStorageAdapter.getWeeklyRaid(fullCycleKey);
  if (existing) {
    return existing;
  }

  // Generate boss procedurally from cycle timing
  const boss = generateProceduralBoss(timing.cycleId, options?.targetFactionId);

  // Health scaling: Individual (2,400 HP) vs Squad (7,500 HP)
  const maxHp = scope === 'squad' ? 7500 : 2400;

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
    isRewardClaimed: false,
    contributions: {},
    updatedAt: now.toISOString(),
  };

  activeStorageAdapter.saveWeeklyRaid(newRaid);
  return newRaid;
}

/**
 * Idempotently applies combat damage to the active weekly raid boss.
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
  activeStorageAdapter.saveWeeklyRaid(raid);

  return raid;
}

/**
 * Claims weekly raid spoils if defeated and not previously claimed.
 */
export function claimWeeklyRaidRewards(cycleId: string): {
  success: boolean;
  gloryXpAwarded: number;
  message: string;
} {
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

  const gloryXpAwarded = 500;
  return {
    success: true,
    gloryXpAwarded,
    message: `Victory! Claimed ${gloryXpAwarded} Glory XP for neutralizing ${raid.boss.name}.`,
  };
}

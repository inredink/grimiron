import {
  DailyStepRecord,
  StepMilestone,
  BodyweightRecord,
  BodyweightGoal,
  WeightAnalytics,
  StasisSleepRecord,
  WeightGoalType,
} from '../../types/biometrics';
import { awardXp } from '../progression/xpService';

declare const require: any;

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_MILESTONES: StepMilestone[] = [
  { milestoneKey: 'steps_10k', targetSteps: 10000, title: 'Pathfinder Scout', xpReward: 50, badgeName: 'Iron Scout', achievedAt: null },
  { milestoneKey: 'steps_50k', targetSteps: 50000, title: 'Trench Walker', xpReward: 100, badgeName: 'Vanguard Walker', achievedAt: null },
  { milestoneKey: 'steps_100k', targetSteps: 100000, title: 'Marcher of the Iron Line', xpReward: 250, badgeName: 'Centurion Strider', achievedAt: null },
  { milestoneKey: 'steps_500k', targetSteps: 500000, title: 'Orbital Vanguard', xpReward: 500, badgeName: 'Orbital Greaves', achievedAt: null },
  { milestoneKey: 'steps_1m', targetSteps: 1000000, title: 'The Tireless', xpReward: 1000, badgeName: 'Crusade Pilgrim', achievedAt: null },
  { milestoneKey: 'steps_5m', targetSteps: 5000000, title: 'Titan Strider', xpReward: 2500, badgeName: 'Warlord Marcher', achievedAt: null },
];

export interface BiometricsStorageAdapter {
  getDailyStep(date: string): DailyStepRecord | null;
  saveDailyStep(record: DailyStepRecord): void;
  getLifetimeSteps(): number;
  getAllMilestones(): StepMilestone[];
  updateMilestone(key: string, achievedAt: string): void;
  getBodyweightHistory(limit: number): BodyweightRecord[];
  saveBodyweight(record: BodyweightRecord): void;
  getBodyweightGoal(characterId: string): BodyweightGoal | null;
  saveBodyweightGoal(goal: BodyweightGoal): void;
  getSleepRecords(limit: number): StasisSleepRecord[];
  saveSleepRecord(record: StasisSleepRecord): void;
}

// ====================================================================
// IN-MEMORY STORAGE ADAPTER (Node test suite & fallback)
// ====================================================================

class InMemoryBiometricsStorage implements BiometricsStorageAdapter {
  private dailySteps = new Map<string, DailyStepRecord>();
  private milestones: StepMilestone[] = JSON.parse(JSON.stringify(DEFAULT_MILESTONES));
  private bodyweight = new Map<string, BodyweightRecord>();
  private goals = new Map<string, BodyweightGoal>();
  private sleep = new Map<string, StasisSleepRecord>();

  getDailyStep(date: string): DailyStepRecord | null {
    return this.dailySteps.get(date) ? { ...this.dailySteps.get(date)! } : null;
  }

  saveDailyStep(record: DailyStepRecord): void {
    this.dailySteps.set(record.date, { ...record });
  }

  getLifetimeSteps(): number {
    let sum = 0;
    for (const r of this.dailySteps.values()) {
      sum += r.steps;
    }
    return sum;
  }

  getAllMilestones(): StepMilestone[] {
    return this.milestones.map((m) => ({ ...m }));
  }

  updateMilestone(key: string, achievedAt: string): void {
    const idx = this.milestones.findIndex((m) => m.milestoneKey === key);
    if (idx >= 0) {
      this.milestones[idx].achievedAt = achievedAt;
    }
  }

  getBodyweightHistory(limit: number): BodyweightRecord[] {
    const list = Array.from(this.bodyweight.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return list.slice(0, limit);
  }

  saveBodyweight(record: BodyweightRecord): void {
    this.bodyweight.set(record.id, { ...record });
  }

  getBodyweightGoal(characterId: string): BodyweightGoal | null {
    return this.goals.get(characterId) ? { ...this.goals.get(characterId)! } : null;
  }

  saveBodyweightGoal(goal: BodyweightGoal): void {
    this.goals.set(goal.characterId, { ...goal });
  }

  getSleepRecords(limit: number): StasisSleepRecord[] {
    const list = Array.from(this.sleep.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return list.slice(0, limit);
  }

  saveSleepRecord(record: StasisSleepRecord): void {
    this.sleep.set(record.id, { ...record });
  }

  clear(): void {
    this.dailySteps.clear();
    this.milestones = JSON.parse(JSON.stringify(DEFAULT_MILESTONES));
    this.bodyweight.clear();
    this.goals.clear();
    this.sleep.clear();
  }
}

// ====================================================================
// SQLITE STORAGE ADAPTER (React Native runtime)
// ====================================================================

class SqliteBiometricsStorage implements BiometricsStorageAdapter {
  private getDb() {
    const { getDatabase } = require('./db');
    return getDatabase();
  }

  getDailyStep(date: string): DailyStepRecord | null {
    try {
      const db = this.getDb();
      const row = db.getFirstSync(
        'SELECT * FROM daily_step_records WHERE date = ?',
        [date]
      );
      if (!row) return null;
      return {
        date: row.date,
        steps: row.steps,
        distanceMeters: row.distance_meters,
        dailyTarget: row.daily_target,
        auxXpAwarded: row.aux_xp_awarded,
        isTargetMet: Boolean(row.is_target_met),
        reconIntelAwarded: row.recon_intel_awarded,
        updatedAt: row.updated_at,
      };
    } catch {
      return null;
    }
  }

  saveDailyStep(record: DailyStepRecord): void {
    try {
      const db = this.getDb();
      db.runSync(
        `INSERT INTO daily_step_records
         (date, steps, distance_meters, daily_target, aux_xp_awarded, is_target_met, recon_intel_awarded, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET
           steps = excluded.steps,
           distance_meters = excluded.distance_meters,
           daily_target = excluded.daily_target,
           aux_xp_awarded = excluded.aux_xp_awarded,
           is_target_met = excluded.is_target_met,
           recon_intel_awarded = excluded.recon_intel_awarded,
           updated_at = excluded.updated_at`,
        [
          record.date,
          record.steps,
          record.distanceMeters,
          record.dailyTarget,
          record.auxXpAwarded,
          record.isTargetMet ? 1 : 0,
          record.reconIntelAwarded,
          record.updatedAt,
        ]
      );
    } catch (err) {
      console.warn('saveDailyStep warning:', err);
    }
  }

  getLifetimeSteps(): number {
    try {
      const db = this.getDb();
      const row = db.getFirstSync(
        'SELECT SUM(steps) as total_steps FROM daily_step_records'
      );
      return row?.total_steps || 0;
    } catch {
      return 0;
    }
  }

  getAllMilestones(): StepMilestone[] {
    try {
      const db = this.getDb();
      const rows = db.getAllSync(
        'SELECT * FROM step_milestones ORDER BY target_steps ASC'
      );
      return rows.map((r: any) => ({
        milestoneKey: r.milestone_key,
        targetSteps: r.target_steps,
        title: r.title,
        xpReward: r.xp_reward,
        badgeName: r.badge_name,
        achievedAt: r.achieved_at,
      }));
    } catch {
      return DEFAULT_MILESTONES;
    }
  }

  updateMilestone(key: string, achievedAt: string): void {
    try {
      const db = this.getDb();
      db.runSync(
        'UPDATE step_milestones SET achieved_at = ? WHERE milestone_key = ?',
        [achievedAt, key]
      );
    } catch (err) {
      console.warn('updateMilestone warning:', err);
    }
  }

  getBodyweightHistory(limit: number): BodyweightRecord[] {
    try {
      const db = this.getDb();
      const rows = db.getAllSync(
        'SELECT * FROM bodyweight_records ORDER BY date DESC, created_at DESC LIMIT ?',
        [limit]
      );
      return rows.map((r: any) => ({
        id: r.id,
        date: r.date,
        weight: r.weight,
        unit: r.unit,
        emaWeight: r.ema_weight,
        notes: r.notes || undefined,
        createdAt: r.created_at,
      }));
    } catch {
      return [];
    }
  }

  saveBodyweight(record: BodyweightRecord): void {
    try {
      const db = this.getDb();
      db.runSync(
        `INSERT INTO bodyweight_records (id, date, weight, unit, ema_weight, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [record.id, record.date, record.weight, record.unit, record.emaWeight, record.notes || null, record.createdAt]
      );
    } catch (err) {
      console.warn('saveBodyweight warning:', err);
    }
  }

  getBodyweightGoal(characterId: string): BodyweightGoal | null {
    try {
      const db = this.getDb();
      const row = db.getFirstSync(
        'SELECT * FROM bodyweight_goals WHERE character_id = ?',
        [characterId]
      );
      if (!row) return null;
      return {
        characterId: row.character_id,
        goalType: row.goal_type as WeightGoalType,
        targetWeight: row.target_weight,
        weeklyRatePercent: row.weekly_rate_percent,
        updatedAt: row.updated_at,
      };
    } catch {
      return null;
    }
  }

  saveBodyweightGoal(goal: BodyweightGoal): void {
    try {
      const db = this.getDb();
      db.runSync(
        `INSERT INTO bodyweight_goals (character_id, goal_type, target_weight, weekly_rate_percent, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(character_id) DO UPDATE SET
           goal_type = excluded.goal_type,
           target_weight = excluded.target_weight,
           weekly_rate_percent = excluded.weekly_rate_percent,
           updated_at = excluded.updated_at`,
        [
          goal.characterId,
          goal.goalType,
          goal.targetWeight,
          goal.weeklyRatePercent,
          goal.updatedAt,
        ]
      );
    } catch (err) {
      console.warn('saveBodyweightGoal warning:', err);
    }
  }

  getSleepRecords(limit: number): StasisSleepRecord[] {
    try {
      const db = this.getDb();
      const rows = db.getAllSync(
        'SELECT * FROM stasis_sleep_records ORDER BY date DESC, logged_at DESC LIMIT ?',
        [limit]
      );
      return rows.map((r: any) => ({
        id: r.id,
        date: r.date,
        hoursSlept: r.hours_slept,
        isWellRested: Boolean(r.is_well_rested),
        auxXpAwarded: r.aux_xp_awarded,
        loggedAt: r.logged_at,
      }));
    } catch {
      return [];
    }
  }

  saveSleepRecord(record: StasisSleepRecord): void {
    try {
      const db = this.getDb();
      db.runSync(
        `INSERT INTO stasis_sleep_records (id, date, hours_slept, is_well_rested, aux_xp_awarded, logged_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [record.id, record.date, record.hoursSlept, record.isWellRested ? 1 : 0, record.auxXpAwarded, record.loggedAt]
      );
    } catch (err) {
      console.warn('saveSleepRecord warning:', err);
    }
  }
}

export const inMemoryBiometricsStorage = new InMemoryBiometricsStorage();
export const sqliteBiometricsStorage = new SqliteBiometricsStorage();

let activeStorage: BiometricsStorageAdapter = inMemoryBiometricsStorage;

export function setBiometricsStorageAdapter(adapter: BiometricsStorageAdapter): void {
  activeStorage = adapter;
}

export function initializeBiometricsSqliteStorage(): void {
  activeStorage = sqliteBiometricsStorage;
}

// ====================================================================
// PUBLIC API IMPLEMENTATION
// ====================================================================

export function getDailyStepRecord(date: string = getTodayString()): DailyStepRecord | null {
  return activeStorage.getDailyStep(date);
}

export function saveDailyStepRecord(
  steps: number,
  target: number = 10000,
  date: string = getTodayString()
): { record: DailyStepRecord; newlyAwardedXp: number; newlyMetTarget: boolean } {
  const existing = activeStorage.getDailyStep(date);
  const effectiveSteps = Math.max(0, Math.round(steps));
  const effectiveTarget = Math.max(1000, Math.round(target));
  const distanceMeters = Math.round(effectiveSteps * 0.762);
  const nowIso = new Date().toISOString();

  let isTargetMet = false;
  let newlyMetTarget = false;
  let newlyAwardedXp = 0;
  let auxXpAwarded = 0;
  let reconIntel = 0;

  if (existing) {
    isTargetMet = existing.isTargetMet || effectiveSteps >= effectiveTarget;
    newlyMetTarget = !existing.isTargetMet && isTargetMet;
    auxXpAwarded = existing.auxXpAwarded;
    reconIntel = existing.reconIntelAwarded;

    if (newlyMetTarget && existing.auxXpAwarded === 0) {
      newlyAwardedXp = 25;
      auxXpAwarded = 25;
      reconIntel = 1;
      awardXp({
        amount: 25,
        sourceType: 'forced_march',
        reason: 'daily_forced_march',
        idempotencyKey: `daily_steps_${date}`,
      });
    }

    const updatedRecord: DailyStepRecord = {
      date,
      steps: effectiveSteps,
      distanceMeters,
      dailyTarget: effectiveTarget,
      auxXpAwarded,
      isTargetMet,
      reconIntelAwarded: reconIntel,
      updatedAt: nowIso,
    };
    activeStorage.saveDailyStep(updatedRecord);
  } else {
    isTargetMet = effectiveSteps >= effectiveTarget;
    newlyMetTarget = isTargetMet;
    if (newlyMetTarget) {
      newlyAwardedXp = 25;
      auxXpAwarded = 25;
      reconIntel = 1;
      awardXp({
        amount: 25,
        sourceType: 'forced_march',
        reason: 'daily_forced_march',
        idempotencyKey: `daily_steps_${date}`,
      });
    }

    const newRecord: DailyStepRecord = {
      date,
      steps: effectiveSteps,
      distanceMeters,
      dailyTarget: effectiveTarget,
      auxXpAwarded,
      isTargetMet,
      reconIntelAwarded: reconIntel,
      updatedAt: nowIso,
    };
    activeStorage.saveDailyStep(newRecord);
  }

  // Check cumulative lifetime step milestones
  const lifetimeSteps = getLifetimeTotalSteps();
  checkAndClaimStepMilestones(lifetimeSteps);

  const updated = activeStorage.getDailyStep(date)!;
  return {
    record: updated,
    newlyAwardedXp,
    newlyMetTarget,
  };
}

export function getLifetimeTotalSteps(): number {
  return activeStorage.getLifetimeSteps();
}

export function getAllStepMilestones(): StepMilestone[] {
  return activeStorage.getAllMilestones();
}

export function checkAndClaimStepMilestones(
  totalSteps?: number
): { newlyAchieved: StepMilestone[]; totalXpEarned: number } {
  const effectiveTotal = totalSteps !== undefined ? totalSteps : getLifetimeTotalSteps();
  const milestones = activeStorage.getAllMilestones();
  const newlyAchieved: StepMilestone[] = [];
  let totalXpEarned = 0;
  const nowIso = new Date().toISOString();

  for (const m of milestones) {
    if (!m.achievedAt && effectiveTotal >= m.targetSteps) {
      activeStorage.updateMilestone(m.milestoneKey, nowIso);
      awardXp({
        amount: m.xpReward,
        sourceType: 'step_milestone',
        reason: `milestone_${m.milestoneKey}`,
        ignoreCap: true,
        idempotencyKey: `step_milestone_${m.milestoneKey}`,
      });
      newlyAchieved.push({ ...m, achievedAt: nowIso });
      totalXpEarned += m.xpReward;
    }
  }

  return { newlyAchieved, totalXpEarned };
}

export function hasDailyReconIntelToday(date: string = getTodayString()): boolean {
  const rec = activeStorage.getDailyStep(date);
  return Boolean(rec && rec.reconIntelAwarded > 0);
}

export function getBodyweightHistory(limit: number = 30): BodyweightRecord[] {
  return activeStorage.getBodyweightHistory(limit);
}

export function logBodyweight(
  weight: number,
  unit: 'lbs' | 'kg' = 'lbs',
  date: string = getTodayString(),
  notes?: string
): { record: BodyweightRecord; auxXpAwarded: number } {
  const cleanWeight = Math.round(weight * 10) / 10;
  const id = `bw_${date}_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const history = activeStorage.getBodyweightHistory(30);
  const priorRecords = history
    .filter((h) => h.date < date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let ema = cleanWeight;
  if (priorRecords.length > 0) {
    const lastPrior = priorRecords[priorRecords.length - 1];
    const alpha = 0.25;
    ema = Math.round((cleanWeight * alpha + lastPrior.emaWeight * (1 - alpha)) * 10) / 10;
  }

  const existingToday = history.some((h) => h.date === date);
  let auxXpAwarded = 0;
  if (!existingToday) {
    auxXpAwarded = 5;
    awardXp({
      amount: 5,
      sourceType: 'biomarker_weighin',
      reason: 'biomarker_weighin',
      idempotencyKey: `bw_xp_${date}`,
    });
  }

  const record: BodyweightRecord = {
    id,
    date,
    weight: cleanWeight,
    unit,
    emaWeight: ema,
    notes,
    createdAt: nowIso,
  };

  activeStorage.saveBodyweight(record);
  return { record, auxXpAwarded };
}

export function getBodyweightGoal(characterId: string = 'char_main'): BodyweightGoal {
  const goal = activeStorage.getBodyweightGoal(characterId);
  if (!goal) {
    return {
      characterId,
      goalType: 'maintenance',
      targetWeight: null,
      weeklyRatePercent: 0.0,
      updatedAt: new Date().toISOString(),
    };
  }
  return goal;
}

export function setBodyweightGoal(
  goal: Partial<BodyweightGoal>,
  characterId: string = 'char_main'
): BodyweightGoal {
  const existing = getBodyweightGoal(characterId);
  const updatedGoal: BodyweightGoal = {
    characterId,
    goalType: goal.goalType || existing.goalType,
    targetWeight: goal.targetWeight !== undefined ? goal.targetWeight : existing.targetWeight,
    weeklyRatePercent: goal.weeklyRatePercent !== undefined ? goal.weeklyRatePercent : existing.weeklyRatePercent,
    updatedAt: new Date().toISOString(),
  };

  activeStorage.saveBodyweightGoal(updatedGoal);
  return updatedGoal;
}

export function computeWeightAnalytics(characterId: string = 'char_main'): WeightAnalytics {
  const history = activeStorage.getBodyweightHistory(30);
  const goal = getBodyweightGoal(characterId);

  if (history.length === 0) {
    return {
      currentWeight: null,
      currentEmaWeight: null,
      unit: 'lbs',
      goalType: goal.goalType,
      targetWeight: goal.targetWeight,
      weeklyRatePercent: goal.weeklyRatePercent,
      actualWeeklyRatePercent: null,
      rateStatus: 'stable',
      logsCount: 0,
    };
  }

  const latest = history[0];
  const unit = latest.unit;
  let actualWeeklyRatePercent: number | null = null;
  let rateStatus: WeightAnalytics['rateStatus'] = 'stable';
  let healthWarning: string | undefined = undefined;

  if (history.length >= 2) {
    const latestDate = new Date(latest.date).getTime();
    const prior = history.slice(1).find((h) => {
      const diffDays = (latestDate - new Date(h.date).getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 6;
    }) || history[history.length - 1];

    const diffDays = Math.max(1, (latestDate - new Date(prior.date).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 3) {
      const weightDelta = latest.emaWeight - prior.emaWeight;
      const weeklyDelta = (weightDelta / diffDays) * 7;
      actualWeeklyRatePercent = Math.round(((weeklyDelta / prior.emaWeight) * 100) * 100) / 100;

      if (goal.goalType === 'fat_loss') {
        if (actualWeeklyRatePercent < -1.5) {
          rateStatus = 'excessive_cut';
          healthWarning = 'CRITICAL DEFICIT WARNING: Loss rate exceeds -1.5%/wk. High risk of lean muscle mass loss and metabolic fatigue. Increase caloric intake.';
        } else if (actualWeeklyRatePercent <= -0.4 && actualWeeklyRatePercent >= -1.2) {
          rateStatus = 'optimal';
        } else {
          rateStatus = 'moderate';
        }
      } else if (goal.goalType === 'hypertrophy_gain') {
        if (actualWeeklyRatePercent > 0.75) {
          rateStatus = 'excessive_bulk';
          healthWarning = 'BULKING SURPLUS CAUTION: Gain rate exceeds +0.75%/wk. Muscle protein synthesis ceiling exceeded; excess is adipose tissue.';
        } else if (actualWeeklyRatePercent >= 0.20 && actualWeeklyRatePercent <= 0.50) {
          rateStatus = 'optimal';
        } else {
          rateStatus = 'moderate';
        }
      } else {
        if (Math.abs(actualWeeklyRatePercent) <= 0.3) {
          rateStatus = 'optimal';
        } else {
          rateStatus = 'moderate';
        }
      }
    }
  }

  return {
    currentWeight: latest.weight,
    currentEmaWeight: latest.emaWeight,
    unit,
    goalType: goal.goalType,
    targetWeight: goal.targetWeight,
    weeklyRatePercent: goal.weeklyRatePercent,
    actualWeeklyRatePercent,
    rateStatus,
    healthWarning,
    logsCount: history.length,
  };
}

export function logStasisSleep(
  hours: number,
  date: string = getTodayString()
): { record: StasisSleepRecord; isWellRested: boolean; auxXpAwarded: number } {
  const cleanHours = Math.max(0, Math.min(24, Math.round(hours * 10) / 10));
  const isWellRested = cleanHours >= 7.0;
  const id = `sleep_${date}_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const history = activeStorage.getSleepRecords(7);
  const existingToday = history.some((h) => h.date === date);

  let auxXpAwarded = 0;
  if (!existingToday && isWellRested) {
    auxXpAwarded = 10;
    awardXp({
      amount: 10,
      sourceType: 'stasis_restoration',
      reason: 'stasis_restoration',
      idempotencyKey: `sleep_xp_${date}`,
    });
  }

  const record: StasisSleepRecord = {
    id,
    date,
    hoursSlept: cleanHours,
    isWellRested,
    auxXpAwarded,
    loggedAt: nowIso,
  };

  activeStorage.saveSleepRecord(record);
  return { record, isWellRested, auxXpAwarded };
}

export function getRecentSleepRecords(limit: number = 7): StasisSleepRecord[] {
  return activeStorage.getSleepRecords(limit);
}

export function isWellRestedToday(date: string = getTodayString()): boolean {
  const records = activeStorage.getSleepRecords(1);
  const todayRecord = records.find((r) => r.date === date);
  return Boolean(todayRecord && todayRecord.isWellRested);
}

/**
 * Rank Progression Curve & Long-Term Calibration Engine
 * 
 * Configures the exponential progression curve for military faction promotions.
 * Calibration Targets:
 * - Tier 1: 0 XP (Initiate Recruit) - Immediate start
 * - Tier 2: 3,500 XP (Full Battle-Brother) - ~2.1 weeks at 3 workouts/week
 * - Tier 3: 8,000 XP (Hardened Veteran) - ~4.8 weeks (~1.1 months)
 * - Tier 4: 18,000 XP (Specialist / Sergeant) - ~10.7 weeks (~2.5 months)
 * - Tier 5: 40,000 XP (Senior Officer / Lieutenant) - ~23.9 weeks (~5.5 months)
 * - Tier 6: 90,000 XP (Commander / Captain) - ~53.7 weeks (~1.0 year)
 * - Tier 7: 200,000 XP (Chapter Master / Supreme Warlord) - ~119 weeks (~2.3 years)
 */

export const RANK_CURVE_CONFIG = {
  STARTING_RANK_TIER: 1,
  BASE_PROMOTION_XP: 3500, // XP needed for Tier 2 promotion
  GROWTH_FACTOR: 2.25,     // Exponential scaling multiplier per successive rank
  TIER_COUNT: 7,
};

/**
 * Returns the exact cumulative minimum XP required for a given rank tier (1 through 7).
 * Formula:
 * - Tier 1: 0 XP
 * - Tier >= 2: round(BASE_PROMOTION_XP * (GROWTH_FACTOR)^(tier - 2) / 100) * 100
 */
export function getRankTierMinXp(tier: number): number {
  if (tier <= RANK_CURVE_CONFIG.STARTING_RANK_TIER) return 0;
  const raw =
    RANK_CURVE_CONFIG.BASE_PROMOTION_XP *
    Math.pow(RANK_CURVE_CONFIG.GROWTH_FACTOR, tier - 2);
  // Round to nearest 100 XP for clean, clear milestone numbers
  return Math.round(raw / 100) * 100;
}

/**
 * Standard progression milestones across all Warhammer 40k factions.
 */
export const STANDARD_RANK_THRESHOLDS: Record<number, number> = {
  1: getRankTierMinXp(1), // 0 XP
  2: getRankTierMinXp(2), // 3,500 XP
  3: getRankTierMinXp(3), // 8,000 XP (7,875 -> 8,000)
  4: getRankTierMinXp(4), // 18,000 XP (17,719 -> 18,000)
  5: getRankTierMinXp(5), // 40,000 XP (39,867 -> 40,000)
  6: getRankTierMinXp(6), // 90,000 XP (89,701 -> 90,000)
  7: getRankTierMinXp(7), // 200,000 XP (201,827 -> 200,000)
};

export interface ProgressionEstimate {
  weeklyWorkouts: number;
  estimatedWeeklyXp: number;
  timeToTierWeeks: Record<number, number>;
  timeToTierMonths: Record<number, number>;
}

/**
 * Calculates estimated weeks and months to reach each rank tier based on weekly training frequency.
 * Assumptions per session:
 * - Average completed workout: ~500 XP
 * - Scheduled rest day recovery bonus: ~75 XP per rest day
 * - Periodic mission / raid participation: ~150 XP/week average
 */
export function simulateProgression(weeklyWorkouts: number): ProgressionEstimate {
  const safeWorkouts = Math.max(1, Math.min(7, weeklyWorkouts));
  const restDays = Math.max(0, 7 - safeWorkouts);

  const workoutXp = safeWorkouts * 500;
  const recoveryXp = restDays * 75;
  const missionXp = 150;
  const estimatedWeeklyXp = workoutXp + recoveryXp + missionXp;

  const timeToTierWeeks: Record<number, number> = {};
  const timeToTierMonths: Record<number, number> = {};

  for (let tier = 1; tier <= RANK_CURVE_CONFIG.TIER_COUNT; tier++) {
    const requiredXp = getRankTierMinXp(tier);
    const weeks = requiredXp === 0 ? 0 : Math.round((requiredXp / estimatedWeeklyXp) * 10) / 10;
    const months = Math.round((weeks / 4.33) * 10) / 10;

    timeToTierWeeks[tier] = weeks;
    timeToTierMonths[tier] = months;
  }

  return {
    weeklyWorkouts: safeWorkouts,
    estimatedWeeklyXp,
    timeToTierWeeks,
    timeToTierMonths,
  };
}

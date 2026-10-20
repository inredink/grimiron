import { AppSettings } from '../../types/settings';
import { UserProgramEnrollment } from '../../types/program';

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export interface RecoveryStorageAdapter {
  hasAlreadyReceivedRecoveryXp(dateStr: string): boolean;
  recordRecoveryXp(
    txId: string,
    amount: number,
    detailsJson: string,
    createdAt: string
  ): void;
}

const inMemoryClaimedDates = new Set<string>();

export const inMemoryRecoveryStorage: RecoveryStorageAdapter = {
  hasAlreadyReceivedRecoveryXp: (dateStr: string) => inMemoryClaimedDates.has(dateStr),
  recordRecoveryXp: (txId, amount, detailsJson) => {
    try {
      const parsed = JSON.parse(detailsJson);
      if (parsed.date) inMemoryClaimedDates.add(parsed.date);
    } catch {}
  },
};

let currentRecoveryStorage: RecoveryStorageAdapter = inMemoryRecoveryStorage;

export function setRecoveryStorageAdapter(adapter: RecoveryStorageAdapter): void {
  currentRecoveryStorage = adapter;
}

/**
 * Checks if a given date is eligible for planned recovery recognition.
 * Eligibility is based on:
 * 1. The day is NOT one of the user's configured preferred training days, OR
 * 2. An active training program prescribes a rest day today.
 */
export function isRecoveryDayEligible(
  targetDate: Date = new Date(),
  preferredDays: string[] = ['monday', 'wednesday', 'friday'],
  activeEnrollment?: UserProgramEnrollment | null
): { eligible: boolean; reason: string } {
  const dayName = DAY_NAMES[targetDate.getDay()];
  const isPreferredTrainingDay = preferredDays.includes(dayName);

  // If user trains on this day, check if active program prescribed a rest day
  if (isPreferredTrainingDay) {
    if (activeEnrollment) {
      const snap = activeEnrollment.programSnapshot;
      const block =
        snap.blocks.find(
          (b) => b.blockNumber === activeEnrollment.currentBlockNumber
        ) || snap.blocks[0];
      const session =
        block?.sessions?.[activeEnrollment.currentSessionIndex] || block?.sessions?.[0];
      if (session && session.isRestDay) {
        return {
          eligible: true,
          reason: `Program "${activeEnrollment.programTitle}" prescribes a planned rest session today.`,
        };
      }
    }
    return {
      eligible: false,
      reason: `${dayName.toUpperCase()} is scheduled as an active training day.`,
    };
  }

  return {
    eligible: true,
    reason: `${dayName.toUpperCase()} is an observed rest day in your weekly schedule.`,
  };
}

/**
 * Checks if recovery XP has already been awarded for a given calendar date.
 * Enforces anti-farming policy: max 1 recovery XP award per calendar day.
 */
export function hasAlreadyReceivedRecoveryXp(dateStr: string): boolean {
  return currentRecoveryStorage.hasAlreadyReceivedRecoveryXp(dateStr);
}

/**
 * Evaluates and awards recovery XP if eligible and not already claimed.
 * Enforces configurable reward caps and prevents abuse.
 */
export function awardRecoveryDayXp(
  targetDate: Date = new Date(),
  settings: AppSettings,
  activeEnrollment?: UserProgramEnrollment | null
): { awarded: boolean; xpEarned: number; reason: string } {
  if (!settings.training_recovery_xp_enabled) {
    return {
      awarded: false,
      xpEarned: 0,
      reason: 'Recovery XP is disabled in Settings.',
    };
  }

  const dateStr = targetDate.toISOString().split('T')[0];

  // 1. Anti-farming check: Already claimed today?
  if (hasAlreadyReceivedRecoveryXp(dateStr)) {
    return {
      awarded: false,
      xpEarned: 0,
      reason: `Recovery XP already recorded for ${dateStr}.`,
    };
  }

  // 2. Eligibility check
  const eligibility = isRecoveryDayEligible(
    targetDate,
    settings.training_preferred_days,
    activeEnrollment
  );
  if (!eligibility.eligible) {
    return {
      awarded: false,
      xpEarned: 0,
      reason: eligibility.reason,
    };
  }

  // 3. Award bounded XP
  const xpAmount = Math.min(Math.max(10, settings.training_recovery_xp_amount || 50), 200);

  try {
    const txId = `xptx_rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const detailsJson = JSON.stringify({
      date: dateStr,
      preference: settings.training_recovery_preference,
      reason: eligibility.reason,
    });
    const now = new Date().toISOString();

    currentRecoveryStorage.recordRecoveryXp(txId, xpAmount, detailsJson, now);

    return {
      awarded: true,
      xpEarned: xpAmount,
      reason: `Honored planned recovery window on ${dateStr}. ${xpAmount} Recovery XP awarded.`,
    };
  } catch (err) {
    console.error('Failed to award recovery XP:', err);
    return {
      awarded: false,
      xpEarned: 0,
      reason: 'Database transaction error awarding recovery XP.',
    };
  }
}

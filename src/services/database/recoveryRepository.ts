import { getDatabase } from './db';
import {
  RecoveryStorageAdapter,
  setRecoveryStorageAdapter,
} from '../progression/recoveryEngine';
import { awardXp } from '../progression/xpService';

export const sqliteRecoveryStorage: RecoveryStorageAdapter = {
  hasAlreadyReceivedRecoveryXp: (dateStr: string): boolean => {
    const db = getDatabase();
    try {
      const row = db.getFirstSync<{ count: number }>(
        `SELECT COUNT(*) as count FROM xp_transactions
         WHERE source_type = 'recovery_day'
         AND (calendar_day = ? OR idempotency_key = ? OR details_json LIKE ?);`,
        [dateStr, `recovery_${dateStr}`, `%"date":"${dateStr}"%`]
      );
      return (row?.count || 0) > 0;
    } catch (err) {
      console.warn('Error checking recovery XP history:', err);
      return false;
    }
  },

  recordRecoveryXp: (
    txId: string,
    amount: number,
    detailsJson: string,
    createdAt: string
  ): void => {
    let dateStr = '';
    try {
      const parsed = JSON.parse(detailsJson);
      dateStr = parsed.date || '';
    } catch {}

    awardXp({
      transactionId: txId,
      amount,
      sourceType: 'recovery_day',
      idempotencyKey: dateStr ? `recovery_${dateStr}` : txId,
      reason: `Honored planned recovery window on ${dateStr}`,
      details: { detailsJson },
      targetDate: createdAt ? new Date(createdAt) : new Date(),
    });
  },
};

export function initializeRecoverySqliteStorage(): void {
  setRecoveryStorageAdapter(sqliteRecoveryStorage);
}

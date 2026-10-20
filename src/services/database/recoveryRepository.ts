import { getDatabase } from './db';
import { addCharacterXp } from './characterRepository';
import {
  RecoveryStorageAdapter,
  setRecoveryStorageAdapter,
} from '../progression/recoveryEngine';

export const sqliteRecoveryStorage: RecoveryStorageAdapter = {
  hasAlreadyReceivedRecoveryXp: (dateStr: string): boolean => {
    const db = getDatabase();
    try {
      const row = db.getFirstSync<{ count: number }>(
        `SELECT COUNT(*) as count FROM xp_transactions
         WHERE source_type = 'recovery_day'
         AND details_json LIKE ?;`,
        [`%"date":"${dateStr}"%`]
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
    const db = getDatabase();
    addCharacterXp(amount);
    db.runSync(
      `INSERT INTO xp_transactions (id, session_id, amount, source_type, details_json, created_at)
       VALUES (?, NULL, ?, 'recovery_day', ?, ?);`,
      [txId, amount, detailsJson, createdAt]
    );
  },
};

export function initializeRecoverySqliteStorage(): void {
  setRecoveryStorageAdapter(sqliteRecoveryStorage);
}

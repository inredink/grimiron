import { getDatabase } from './db';
import { addCharacterXp, getCharacterProfile } from './characterRepository';
import {
  XpStorageAdapter,
  XpTransactionRow,
  setXpStorageAdapter,
} from '../progression/xpService';

export const sqliteXpStorage: XpStorageAdapter = {
  getTransactionByIdempotencyKey: (key: string): XpTransactionRow | null => {
    const db = getDatabase();
    try {
      return db.getFirstSync<XpTransactionRow>(
        'SELECT * FROM xp_transactions WHERE idempotency_key = ?',
        [key]
      );
    } catch {
      return null;
    }
  },

  getDailyXpCredited: (calendarDay: string): number => {
    const db = getDatabase();
    try {
      const row = db.getFirstSync<{ total: number | null }>(
        'SELECT COALESCE(SUM(amount), 0) as total FROM xp_transactions WHERE calendar_day = ?',
        [calendarDay]
      );
      return row?.total || 0;
    } catch {
      return 0;
    }
  },

  recordTransaction: (tx: XpTransactionRow): void => {
    const db = getDatabase();
    db.runSync(
      `INSERT INTO xp_transactions (
        id, user_id, character_id, session_id, amount, requested_amount,
        source_type, calendar_day, is_capped, reason, idempotency_key, details_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tx.id,
        tx.user_id,
        tx.character_id,
        tx.session_id,
        tx.amount,
        tx.requested_amount,
        tx.source_type,
        tx.calendar_day,
        tx.is_capped,
        tx.reason,
        tx.idempotency_key,
        tx.details_json,
        tx.created_at,
      ]
    );
  },

  getRecentTransactions: (limit: number = 20): XpTransactionRow[] => {
    const db = getDatabase();
    try {
      return db.getAllSync<XpTransactionRow>(
        'SELECT * FROM xp_transactions ORDER BY created_at DESC LIMIT ?',
        [limit]
      );
    } catch {
      return [];
    }
  },

  incrementCharacterXp: (amount: number): number => {
    const prof = addCharacterXp(amount);
    return prof.totalXp;
  },

  getCharacterTotalXp: (): number => {
    return getCharacterProfile().totalXp;
  },
};

export function initializeXpSqliteStorage(): void {
  setXpStorageAdapter(sqliteXpStorage);
}

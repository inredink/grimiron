/**
 * Centralized XP Economy & Progression Service
 * 
 * Enforces:
 * 1. Single entry point for all XP awards (workouts, recovery, missions, raids, campaigns).
 * 2. Configurable hard daily XP cap (default: 1,000 XP/day) across repeatable sources.
 * 3. Strict idempotency to prevent duplicate XP awards from retries, re-taps, or reconnects.
 * 4. Transparent audit trail recording requested vs. actually credited XP and spillover.
 * 5. Timezone-aware calendar accounting based on user locale.
 * 6. Pluggable storage architecture (InMemory for unit tests, SQLite for app runtime).
 */

export const XP_ECONOMY_CONFIG = {
  DEFAULT_DAILY_XP_CAP: 1000,
  MAX_WORKOUT_SESSION_XP: 800,
  MIN_TRANSACTION_XP: 1,
};

export interface XpAwardRequest {
  amount: number;
  sourceType: string;
  userId?: string;
  characterId?: string;
  sessionId?: string;
  idempotencyKey?: string;
  transactionId?: string;
  reason?: string;
  details?: Record<string, any>;
  dailyCap?: number;
  ignoreCap?: boolean;
  targetDate?: Date;
  timeZone?: string;
}

export interface XpAwardResult {
  transactionId: string;
  requestedAmount: number;
  creditedAmount: number;
  spilloverAmount: number;
  dailyCreditedBefore: number;
  dailyCreditedAfter: number;
  dailyAllowanceRemaining: number;
  dailyCap: number;
  isCapped: boolean;
  isDuplicate: boolean;
  calendarDay: string;
  sourceType: string;
  totalXpNow: number;
}

export interface XpTransactionRow {
  id: string;
  user_id: string;
  character_id: string;
  session_id: string | null;
  amount: number;
  requested_amount: number;
  source_type: string;
  calendar_day: string;
  is_capped: number;
  reason: string | null;
  idempotency_key: string | null;
  details_json: string | null;
  created_at: string;
}

export interface XpStorageAdapter {
  getTransactionByIdempotencyKey(key: string): XpTransactionRow | null;
  getDailyXpCredited(calendarDay: string): number;
  recordTransaction(tx: XpTransactionRow): void;
  getRecentTransactions(limit?: number): XpTransactionRow[];
  incrementCharacterXp(amount: number): number;
  getCharacterTotalXp(): number;
}

export class InMemoryXpStorage implements XpStorageAdapter {
  private transactions: Map<string, XpTransactionRow> = new Map();
  private characterTotalXp: number = 0;

  constructor(initialXp: number = 0) {
    this.characterTotalXp = initialXp;
  }

  getTransactionByIdempotencyKey(key: string): XpTransactionRow | null {
    for (const tx of this.transactions.values()) {
      if (tx.idempotency_key === key) return { ...tx };
    }
    return null;
  }

  getDailyXpCredited(calendarDay: string): number {
    let total = 0;
    for (const tx of this.transactions.values()) {
      if (tx.calendar_day === calendarDay) {
        total += tx.amount;
      }
    }
    return total;
  }

  recordTransaction(tx: XpTransactionRow): void {
    this.transactions.set(tx.id, { ...tx });
  }

  getRecentTransactions(limit: number = 20): XpTransactionRow[] {
    const sorted = Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted.slice(0, limit);
  }

  incrementCharacterXp(amount: number): number {
    this.characterTotalXp += amount;
    return this.characterTotalXp;
  }

  getCharacterTotalXp(): number {
    return this.characterTotalXp;
  }

  clear(): void {
    this.transactions.clear();
    this.characterTotalXp = 0;
  }
}

export const inMemoryXpStorage = new InMemoryXpStorage();
let activeStorageAdapter: XpStorageAdapter = inMemoryXpStorage;

export function setXpStorageAdapter(adapter: XpStorageAdapter): void {
  activeStorageAdapter = adapter;
}

export function getXpStorageAdapter(): XpStorageAdapter {
  return activeStorageAdapter;
}

/**
 * Returns the calendar day string (YYYY-MM-DD) for a given date in the specified or local timezone.
 */
export function getCalendarDay(date: Date = new Date(), timeZone?: string): string {
  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Returns total XP credited for a specific calendar day across all sources.
 */
export function getDailyXpCredited(calendarDay?: string): number {
  const day = calendarDay || getCalendarDay();
  return activeStorageAdapter.getDailyXpCredited(day);
}

/**
 * Returns remaining XP allowance for the specified calendar day before hitting the daily cap.
 */
export function getDailyXpRemaining(
  dailyCap: number = XP_ECONOMY_CONFIG.DEFAULT_DAILY_XP_CAP,
  calendarDay?: string
): number {
  const credited = getDailyXpCredited(calendarDay);
  return Math.max(0, dailyCap - credited);
}

/**
 * Lookup an existing transaction by idempotency key.
 */
export function getXpTransactionByIdempotencyKey(key: string): XpTransactionRow | null {
  return activeStorageAdapter.getTransactionByIdempotencyKey(key);
}

/**
 * Retrieve recent XP transactions for audit and UI telemetry.
 */
export function getRecentXpTransactions(limit: number = 20): XpTransactionRow[] {
  return activeStorageAdapter.getRecentTransactions(limit);
}

/**
 * Centralized XP Award Function.
 * Evaluates idempotency, enforces daily cap allowance, records audit transaction,
 * and increments character total XP.
 */
export function awardXp(request: XpAwardRequest): XpAwardResult {
  const userId = request.userId || 'user_main';
  const characterId = request.characterId || 'char_main';
  const requestedAmount = Math.max(0, Math.floor(request.amount));
  const calendarDay = getCalendarDay(request.targetDate, request.timeZone);
  const dailyCap =
    request.dailyCap !== undefined ? request.dailyCap : XP_ECONOMY_CONFIG.DEFAULT_DAILY_XP_CAP;

  // 1. Check idempotency
  if (request.idempotencyKey) {
    const existing = activeStorageAdapter.getTransactionByIdempotencyKey(request.idempotencyKey);
    if (existing) {
      const dailyCredited = activeStorageAdapter.getDailyXpCredited(existing.calendar_day);
      return {
        transactionId: existing.id,
        requestedAmount: existing.requested_amount,
        creditedAmount: existing.amount,
        spilloverAmount: Math.max(0, existing.requested_amount - existing.amount),
        dailyCreditedBefore: dailyCredited,
        dailyCreditedAfter: dailyCredited,
        dailyAllowanceRemaining: Math.max(0, dailyCap - dailyCredited),
        dailyCap,
        isCapped: existing.is_capped === 1,
        isDuplicate: true,
        calendarDay: existing.calendar_day,
        sourceType: existing.source_type,
        totalXpNow: activeStorageAdapter.getCharacterTotalXp(),
      };
    }
  }

  // 2. Daily allowance check
  const dailyCreditedBefore = activeStorageAdapter.getDailyXpCredited(calendarDay);
  const allowance = Math.max(0, dailyCap - dailyCreditedBefore);

  let creditedAmount = requestedAmount;
  let isCapped = false;

  if (!request.ignoreCap) {
    if (requestedAmount > allowance) {
      creditedAmount = allowance;
      isCapped = true;
    }
  }

  const spilloverAmount = Math.max(0, requestedAmount - creditedAmount);
  const dailyCreditedAfter = dailyCreditedBefore + creditedAmount;
  const dailyAllowanceRemaining = Math.max(0, dailyCap - dailyCreditedAfter);

  const txId =
    request.transactionId ||
    `xptx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const nowIso = (request.targetDate || new Date()).toISOString();

  const details = {
    ...(request.details || {}),
    requestedAmount,
    creditedAmount,
    spilloverAmount,
    dailyCap,
    dailyAllowanceRemaining,
    dailyCreditedBefore,
    dailyCreditedAfter,
    isCapped,
  };

  const txRow: XpTransactionRow = {
    id: txId,
    user_id: userId,
    character_id: characterId,
    session_id: request.sessionId || null,
    amount: creditedAmount,
    requested_amount: requestedAmount,
    source_type: request.sourceType,
    calendar_day: calendarDay,
    is_capped: isCapped ? 1 : 0,
    reason: request.reason || null,
    idempotency_key: request.idempotencyKey || null,
    details_json: JSON.stringify(details),
    created_at: nowIso,
  };

  activeStorageAdapter.recordTransaction(txRow);

  let totalXpNow = 0;
  if (creditedAmount > 0) {
    totalXpNow = activeStorageAdapter.incrementCharacterXp(creditedAmount);
  } else {
    totalXpNow = activeStorageAdapter.getCharacterTotalXp();
  }

  return {
    transactionId: txId,
    requestedAmount,
    creditedAmount,
    spilloverAmount,
    dailyCreditedBefore,
    dailyCreditedAfter,
    dailyAllowanceRemaining,
    dailyCap,
    isCapped,
    isDuplicate: false,
    calendarDay,
    sourceType: request.sourceType,
    totalXpNow,
  };
}

import { getDatabase } from './db';
import { isNamedEnemy } from '../combat/namedEnemyClassifier';
import {
  BattleRecord,
  BattleHistoryFilter,
  BattleParticipantContribution,
  BattleSnapshot,
} from '../../types/battleHistory';

interface BattleHistoryRow {
  id: string;
  encounter_mode: string;
  session_id: string | null;
  mission_id: string | null;
  mission_title: string;
  enemy_id: string;
  enemy_name: string;
  enemy_faction: string | null;
  enemy_difficulty: string | null;
  enemy_max_hp: number;
  enemy_remaining_hp: number;
  outcome: string;
  total_damage: number;
  total_attacks: number;
  participant_count: number;
  squad_id: string | null;
  squad_name: string | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  xp_earned: number;
  snapshot_json: string;
  created_at: string;
}

interface BattleParticipantRow {
  id: string;
  battle_id: string;
  user_id: string;
  callsign: string;
  faction_id: string;
  subfaction_id: string | null;
  attacks_count: number;
  damage_dealt: number;
  damage_share_percent: number;
  workouts_attributed: number;
  sets_attributed: number;
}

/**
 * Saves a completed or in-progress battle encounter into persistent battle history.
 * Guarantees idempotency via INSERT OR REPLACE on battle ID.
 */
export function recordBattleHistory(record: BattleRecord): void {
  const db = getDatabase();

  db.runSync(
    `INSERT OR REPLACE INTO battle_history (
      id, encounter_mode, session_id, mission_id, mission_title,
      enemy_id, enemy_name, enemy_faction, enemy_difficulty,
      enemy_max_hp, enemy_remaining_hp, outcome, total_damage,
      total_attacks, participant_count, squad_id, squad_name,
      started_at, completed_at, duration_seconds, xp_earned,
      snapshot_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      record.encounterMode,
      record.sessionId || null,
      record.missionId || null,
      record.missionTitle,
      record.enemyId,
      record.enemyName,
      record.enemyFaction || null,
      record.enemyDifficulty || null,
      record.enemyMaxHp,
      record.enemyRemainingHp,
      record.outcome,
      record.totalDamage,
      record.totalAttacks,
      record.participantCount,
      record.squadId || null,
      record.squadName || null,
      record.startedAt,
      record.completedAt || null,
      record.durationSeconds || null,
      record.xpEarned,
      JSON.stringify(record.snapshot),
      record.createdAt || new Date().toISOString(),
    ]
  );

  // Store individual participant records
  if (record.snapshot && record.snapshot.participants) {
    for (const p of record.snapshot.participants) {
      const pId = `bp_${record.id}_${p.userId}`;
      db.runSync(
        `INSERT OR REPLACE INTO battle_participants (
          id, battle_id, user_id, callsign, faction_id,
          subfaction_id, attacks_count, damage_dealt,
          damage_share_percent, workouts_attributed, sets_attributed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pId,
          record.id,
          p.userId,
          p.callsign,
          p.factionId,
          p.subfactionId || null,
          p.attacksCount,
          p.damageDealt,
          p.damageSharePercent,
          p.workoutsAttributed,
          p.setsAttributed,
        ]
      );
    }
  }

  // If outcome was victory and enemy is a genuine named raid boss, permanently record in slain ledger.
  // Regular workout day hostiles (solo/coop training) are NEVER recorded into slain_named_enemies.
  const isRaidEncounter =
    record.encounterMode === 'weekly_raid' ||
    record.id?.startsWith('bh_raid_') ||
    Boolean(record.missionId && record.missionId.startsWith('raid_'));

  if (
    record.outcome === 'victory' &&
    record.enemyName &&
    record.enemyName.trim().length > 0 &&
    isRaidEncounter &&
    isNamedEnemy({
      id: record.enemyId,
      name: record.enemyName,
      difficulty: record.enemyDifficulty,
      isRaidBoss: true,
      encounterMode: record.encounterMode,
      missionId: record.missionId,
    })
  ) {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO slain_named_enemies (
          enemy_name, enemy_id, faction_id, enemy_title, difficulty, base_health, slain_at, battle_id
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
        [
          record.enemyName.trim(),
          record.enemyId || null,
          record.enemyFaction || null,
          (record.snapshot as any)?.enemyTitle || null,
          record.enemyDifficulty || null,
          record.enemyMaxHp || 0,
          record.id,
        ]
      );
    } catch {
      // Table may not exist yet in unmigrated test DBs
    }
  }
}

/**
 * Retrieves all battle history records with flexible filtering and sorting.
 */
export function getBattleHistoryList(filter?: BattleHistoryFilter): BattleRecord[] {
  const db = getDatabase();
  let query = 'SELECT * FROM battle_history WHERE 1=1';
  const params: any[] = [];

  if (filter?.outcome && filter.outcome !== 'all') {
    query += ' AND outcome = ?';
    params.push(filter.outcome);
  }

  if (filter?.encounterMode && filter.encounterMode !== 'all') {
    query += ' AND encounter_mode = ?';
    params.push(filter.encounterMode);
  }

  if (filter?.enemyId) {
    query += ' AND enemy_id = ?';
    params.push(filter.enemyId);
  }

  if (filter?.squadId) {
    query += ' AND squad_id = ?';
    params.push(filter.squadId);
  }

  if (filter?.searchQuery && filter.searchQuery.trim().length > 0) {
    const q = `%${filter.searchQuery.trim()}%`;
    query += ' AND (enemy_name LIKE ? OR mission_title LIKE ? OR squad_name LIKE ?)';
    params.push(q, q, q);
  }

  if (filter?.sortBy === 'oldest') {
    query += ' ORDER BY started_at ASC';
  } else if (filter?.sortBy === 'highest_damage') {
    query += ' ORDER BY total_damage DESC';
  } else {
    query += ' ORDER BY started_at DESC';
  }

  const rows = db.getAllSync<BattleHistoryRow>(query, params);
  return rows.map(mapRowToBattleRecord);
}

/**
 * Retrieves a single battle record by ID, including complete snapshot data.
 */
export function getBattleHistoryById(battleId: string): BattleRecord | null {
  const db = getDatabase();
  const row = db.getFirstSync<BattleHistoryRow>(
    'SELECT * FROM battle_history WHERE id = ?',
    [battleId]
  );
  if (!row) return null;
  return mapRowToBattleRecord(row);
}

/**
 * Retrieves a battle record linked to a specific workout session ID.
 */
export function getBattleHistoryBySessionId(sessionId: string): BattleRecord | null {
  const db = getDatabase();
  const row = db.getFirstSync<BattleHistoryRow>(
    'SELECT * FROM battle_history WHERE session_id = ?',
    [sessionId]
  );
  if (!row) return null;
  return mapRowToBattleRecord(row);
}

/**
 * Aggregates career combat metrics from battle history.
 */
export function getBattleCareerMetrics(): {
  totalBattles: number;
  victories: number;
  defeats: number;
  abandoned: number;
  totalDamage: number;
  totalAttacks: number;
  totalXpEarned: number;
} {
  const db = getDatabase();
  const row = db.getFirstSync<{
    total_battles: number;
    victories: number;
    defeats: number;
    abandoned: number;
    total_damage: number;
    total_attacks: number;
    total_xp: number;
  }>(`
    SELECT
      COUNT(*) AS total_battles,
      COALESCE(SUM(CASE WHEN outcome = 'victory' THEN 1 ELSE 0 END), 0) AS victories,
      COALESCE(SUM(CASE WHEN outcome = 'defeat' THEN 1 ELSE 0 END), 0) AS defeats,
      COALESCE(SUM(CASE WHEN outcome = 'abandoned' THEN 1 ELSE 0 END), 0) AS abandoned,
      COALESCE(SUM(total_damage), 0) AS total_damage,
      COALESCE(SUM(total_attacks), 0) AS total_attacks,
      COALESCE(SUM(xp_earned), 0) AS total_xp
    FROM battle_history
  `);

  if (!row) {
    return {
      totalBattles: 0,
      victories: 0,
      defeats: 0,
      abandoned: 0,
      totalDamage: 0,
      totalAttacks: 0,
      totalXpEarned: 0,
    };
  }

  return {
    totalBattles: row.total_battles || 0,
    victories: row.victories || 0,
    defeats: row.defeats || 0,
    abandoned: row.abandoned || 0,
    totalDamage: row.total_damage || 0,
    totalAttacks: row.total_attacks || 0,
    totalXpEarned: row.total_xp || 0,
  };
}

function mapRowToBattleRecord(row: BattleHistoryRow): BattleRecord {
  let snapshot: BattleSnapshot;
  try {
    snapshot = JSON.parse(row.snapshot_json);
  } catch {
    snapshot = {
      enemyDescription: '',
      enemyGlyph: 'skull',
      enemyFaction: row.enemy_faction || 'Hostile Force',
      initialHealth: row.enemy_max_hp,
      finalHealth: row.enemy_remaining_hp,
      timeline: [],
      participants: [],
      userAttacks: [],
      linkedWorkoutIds: row.session_id ? [row.session_id] : [],
      rewards: {
        baseXpEarned: row.xp_earned,
        gloryBonusXp: 0,
        totalXpEarned: row.xp_earned,
      },
      afterActionReportSummary: `${row.outcome.toUpperCase()} against ${row.enemy_name}.`,
    };
  }

  return {
    id: row.id,
    encounterMode: row.encounter_mode as any,
    sessionId: row.session_id || undefined,
    missionId: row.mission_id || undefined,
    missionTitle: row.mission_title,
    enemyId: row.enemy_id,
    enemyName: row.enemy_name,
    enemyFaction: row.enemy_faction || undefined,
    enemyDifficulty: (row.enemy_difficulty as any) || undefined,
    enemyMaxHp: row.enemy_max_hp,
    enemyRemainingHp: row.enemy_remaining_hp,
    outcome: row.outcome as any,
    totalDamage: row.total_damage,
    totalAttacks: row.total_attacks,
    participantCount: row.participant_count,
    squadId: row.squad_id || undefined,
    squadName: row.squad_name || undefined,
    startedAt: row.started_at,
    completedAt: row.completed_at || undefined,
    durationSeconds: row.duration_seconds || undefined,
    xpEarned: row.xp_earned,
    snapshot,
    createdAt: row.created_at,
  };
}

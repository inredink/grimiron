import { getDatabase } from './db';
import { CombatEncounterState, AttackEvent } from '../../types/combat';

export interface CombatEncounterRow {
  id: string;
  session_id: string;
  mission_id: string;
  enemy_id: string;
  enemy_name: string;
  enemy_max_hp: number;
  enemy_remaining_hp: number;
  total_damage: number;
  is_defeated: number;
  attacks_json: string;
  created_at: string;
}

export function saveCombatEncounter(
  sessionId: string,
  state: CombatEncounterState
): void {
  const db = getDatabase();
  const id = `enc_${sessionId}`;
  const now = new Date().toISOString();

  db.runSync(
    `INSERT OR REPLACE INTO combat_encounters (
      id, session_id, mission_id, enemy_id, enemy_name,
      enemy_max_hp, enemy_remaining_hp, total_damage, is_defeated,
      attacks_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      sessionId,
      state.missionId,
      state.enemy.id,
      state.enemy.name,
      state.maxHealth,
      state.currentHealth,
      state.totalDamage,
      state.isDefeated ? 1 : 0,
      JSON.stringify(state.attacks),
      now,
    ]
  );
}

export function getCombatEncounterBySessionId(
  sessionId: string
): {
  id: string;
  missionId: string;
  enemyId: string;
  enemyName: string;
  maxHealth: number;
  remainingHealth: number;
  totalDamage: number;
  isDefeated: boolean;
  attacks: AttackEvent[];
} | null {
  const db = getDatabase();
  const row = db.getFirstSync<CombatEncounterRow>(
    'SELECT * FROM combat_encounters WHERE session_id = ?',
    [sessionId]
  );

  if (!row) return null;

  let attacks: AttackEvent[] = [];
  try {
    attacks = JSON.parse(row.attacks_json);
  } catch {
    attacks = [];
  }

  return {
    id: row.id,
    missionId: row.mission_id,
    enemyId: row.enemy_id,
    enemyName: row.enemy_name,
    maxHealth: row.enemy_max_hp,
    remainingHealth: row.enemy_remaining_hp,
    totalDamage: row.total_damage,
    isDefeated: row.is_defeated === 1,
    attacks,
  };
}

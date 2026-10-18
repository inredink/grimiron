import { CoopAttackPayload } from '../../types/coop';

/**
 * Sanitizes an attack payload by discarding raw weights, repetitions, notes, and RPE.
 * STRICT PRIVACY REQUIREMENT: Raw workout telemetry remains 100% private on the local device.
 * ONLY public attack event descriptors and computed damage are shared with the cooperative crusade.
 */
export function sanitizeCoopAttackPayload(raw: {
  groupBossId: string;
  clientSetId: string;
  exerciseName: string;
  attackName: string;
  styleName: string;
  damage: number;
  weight?: number;
  reps?: number;
  notes?: string;
  rpe?: number;
}): CoopAttackPayload {
  return {
    groupBossId: raw.groupBossId,
    clientSetId: raw.clientSetId,
    exerciseName: raw.exerciseName,
    attackName: raw.attackName,
    styleName: raw.styleName,
    damage: Math.max(1, Math.round(raw.damage)),
  };
}

/**
 * Simulates server-side atomic attack processing with row locking and idempotency.
 * Mirrors the exact PostgreSQL stored procedure `record_coop_attack`.
 */
export function simulateServerRecordCoopAttack(
  boss: { id: string; currentHp: number; maxHp: number; isDefeated: boolean },
  attackLog: Array<{ groupBossId: string; clientSetId: string; damage: number }>,
  attack: CoopAttackPayload
): {
  status: 'attack_recorded' | 'duplicate_ignored';
  newHp: number;
  isDefeated: boolean;
  damageDealt: number;
} {
  // Idempotency check: unique constraint (group_boss_id, client_set_id)
  const isDuplicate = attackLog.some(
    (a) => a.groupBossId === attack.groupBossId && a.clientSetId === attack.clientSetId
  );

  if (isDuplicate) {
    return {
      status: 'duplicate_ignored',
      newHp: boss.currentHp,
      isDefeated: boss.isDefeated,
      damageDealt: 0,
    };
  }

  // Atomically record attack
  attackLog.push({
    groupBossId: attack.groupBossId,
    clientSetId: attack.clientSetId,
    damage: attack.damage,
  });

  const newHp = Math.max(0, boss.currentHp - attack.damage);
  const isDefeated = newHp === 0;

  boss.currentHp = newHp;
  boss.isDefeated = isDefeated;

  return {
    status: 'attack_recorded',
    newHp,
    isDefeated,
    damageDealt: attack.damage,
  };
}

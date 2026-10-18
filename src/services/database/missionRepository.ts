import { getDatabase } from './db';
import {
  ActiveMissionRecord,
  FactionMissionDefinition,
  MissionObjectiveProgress,
  MissionRewardDefinition,
  MissionStatus,
} from '../../types/mission';

interface MissionProgressRow {
  id: string;
  mission_id: string;
  faction_id: string;
  subfaction_id: string | null;
  character_id: string;
  status: string;
  objectives_json: string;
  started_at: string | null;
  completed_at: string | null;
  rewards_json: string;
  is_claimed: number;
  created_at: string;
}

/**
 * Saves or updates a mission progress record in SQLite.
 * Uses ON CONFLICT on (character_id, mission_id) for strict idempotency.
 */
export function saveMissionRecord(record: ActiveMissionRecord): void {
  const db = getDatabase();

  db.runSync(
    `INSERT INTO mission_progress (
      id, mission_id, faction_id, subfaction_id, character_id,
      status, objectives_json, started_at, completed_at,
      rewards_json, is_claimed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(character_id, mission_id) DO UPDATE SET
      status = excluded.status,
      objectives_json = excluded.objectives_json,
      started_at = excluded.started_at,
      completed_at = excluded.completed_at,
      rewards_json = excluded.rewards_json,
      is_claimed = excluded.is_claimed`,
    [
      record.id,
      record.missionId,
      record.factionId,
      record.subfactionId || null,
      record.characterId,
      record.status,
      JSON.stringify(record.objectives),
      record.startedAt || null,
      record.completedAt || null,
      JSON.stringify(record.rewards),
      record.isClaimed ? 1 : 0,
      new Date().toISOString(),
    ]
  );
}

/**
 * Retrieves a specific mission record for a character.
 */
export function getMissionRecord(
  characterId: string,
  missionId: string
): ActiveMissionRecord | null {
  const db = getDatabase();
  const row = db.getFirstSync<MissionProgressRow>(
    'SELECT * FROM mission_progress WHERE character_id = ? AND mission_id = ?',
    [characterId, missionId]
  );
  if (!row) return null;
  return mapMissionRow(row);
}

/**
 * Retrieves all mission records for a character.
 */
export function getAllMissionRecords(characterId: string): ActiveMissionRecord[] {
  const db = getDatabase();
  const rows = db.getAllSync<MissionProgressRow>(
    'SELECT * FROM mission_progress WHERE character_id = ? ORDER BY created_at DESC',
    [characterId]
  );
  return rows.map(mapMissionRow);
}

/**
 * Retrieves missions by status (e.g. active, completed) for a character.
 */
export function getMissionsByStatus(
  characterId: string,
  status: MissionStatus
): ActiveMissionRecord[] {
  const db = getDatabase();
  const rows = db.getAllSync<MissionProgressRow>(
    'SELECT * FROM mission_progress WHERE character_id = ? AND status = ? ORDER BY started_at DESC',
    [characterId, status]
  );
  return rows.map(mapMissionRow);
}

/**
 * Activates a mission for the character if it is not already active or completed.
 */
export function activateMission(
  characterId: string,
  mission: FactionMissionDefinition
): ActiveMissionRecord {
  const existing = getMissionRecord(characterId, mission.id);
  if (existing && (existing.status === 'active' || existing.status === 'completed')) {
    return existing;
  }

  const initialObjectives: MissionObjectiveProgress[] = mission.objectives.map((obj) => ({
    objectiveId: obj.id,
    currentValue: 0,
    targetValue: obj.targetValue,
    isCompleted: false,
    progressPercent: 0,
  }));

  const newRecord: ActiveMissionRecord = {
    id: `mrec_${characterId}_${mission.id}`,
    missionId: mission.id,
    factionId: mission.factionId,
    subfactionId: mission.subfactionId,
    characterId,
    status: 'active',
    objectives: initialObjectives,
    startedAt: new Date().toISOString(),
    rewards: mission.rewards,
    isClaimed: false,
    mission,
  };

  saveMissionRecord(newRecord);
  return newRecord;
}

/**
 * Marks mission rewards as claimed.
 * Returns true if successfully claimed, false if already claimed or not completed.
 */
export function claimMissionReward(characterId: string, missionId: string): boolean {
  const db = getDatabase();
  const record = getMissionRecord(characterId, missionId);
  if (!record || record.status !== 'completed' || record.isClaimed) {
    return false;
  }

  db.runSync(
    'UPDATE mission_progress SET is_claimed = 1 WHERE character_id = ? AND mission_id = ?',
    [characterId, missionId]
  );
  return true;
}

function mapMissionRow(row: MissionProgressRow): ActiveMissionRecord {
  let objectives: MissionObjectiveProgress[] = [];
  try {
    objectives = JSON.parse(row.objectives_json);
  } catch {
    objectives = [];
  }

  let rewards: MissionRewardDefinition[] = [];
  try {
    rewards = JSON.parse(row.rewards_json);
  } catch {
    rewards = [];
  }

  return {
    id: row.id,
    missionId: row.mission_id,
    factionId: row.faction_id,
    subfactionId: row.subfaction_id || undefined,
    characterId: row.character_id,
    status: row.status as MissionStatus,
    objectives,
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined,
    rewards,
    isClaimed: row.is_claimed === 1,
  };
}

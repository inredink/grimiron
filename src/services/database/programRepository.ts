import { getDatabase } from './db';
import {
  UserProgramEnrollment,
  ProgramSessionRecord,
  TrainingProgramDefinition,
} from '../../types/program';

/**
 * SQLite Repository for Training Program Enrollments, Sessions, and Custom Templates.
 */

export function saveProgramEnrollment(enrollment: UserProgramEnrollment): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO user_programs (
      id, character_id, program_id, program_title, program_category,
      status, current_block_number, current_session_index, program_snapshot_json,
      started_at, last_session_at, completed_sessions_count, total_planned_sessions_count, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      enrollment.id,
      enrollment.characterId,
      enrollment.programId,
      enrollment.programTitle,
      enrollment.programCategory,
      enrollment.status,
      enrollment.currentBlockNumber,
      enrollment.currentSessionIndex,
      JSON.stringify(enrollment.programSnapshot),
      enrollment.startedAt,
      enrollment.lastSessionAt || null,
      enrollment.completedSessionsCount,
      enrollment.totalPlannedSessionsCount,
      new Date().toISOString(),
    ]
  );
}

export function getActiveProgramEnrollment(
  characterId: string = 'char_main'
): UserProgramEnrollment | null {
  const db = getDatabase();
  const row = db.getFirstSync<any>(
    `SELECT * FROM user_programs WHERE (character_id = ? OR character_id = 'char_main' OR character_id = '1') AND status = 'active' ORDER BY updated_at DESC LIMIT 1`,
    [characterId]
  );

  if (!row) return null;

  try {
    return {
      id: row.id,
      characterId: row.character_id,
      programId: row.program_id,
      programTitle: row.program_title,
      programCategory: row.program_category,
      programSnapshot: JSON.parse(row.program_snapshot_json),
      currentBlockNumber: row.current_block_number,
      currentSessionIndex: row.current_session_index,
      status: row.status,
      startedAt: row.started_at,
      lastSessionAt: row.last_session_at || undefined,
      completedSessionsCount: row.completed_sessions_count,
      totalPlannedSessionsCount: row.total_planned_sessions_count,
      adherencePercent:
        row.total_planned_sessions_count > 0
          ? Math.min(
              100,
              Math.round(
                (row.completed_sessions_count / row.total_planned_sessions_count) *
                  100
              )
            )
          : 0,
    };
  } catch (err) {
    console.error('Failed to parse program snapshot JSON:', err);
    return null;
  }
}

export function pauseProgramEnrollment(enrollmentId: string): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE user_programs SET status = 'paused', updated_at = ? WHERE id = ?`,
    [new Date().toISOString(), enrollmentId]
  );
}

export function resumeProgramEnrollment(enrollmentId: string): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE user_programs SET status = 'active', updated_at = ? WHERE id = ?`,
    [new Date().toISOString(), enrollmentId]
  );
}

export function recordProgramSession(record: ProgramSessionRecord): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO program_session_records (
      id, enrollment_id, program_id, scheduled_session_id, workout_session_id,
      status, scheduled_date, completed_date, actual_sets_completed,
      prescribed_sets_count, actual_volume_kg, deviation_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      record.enrollmentId,
      record.programId,
      record.scheduledSessionId,
      record.workoutSessionId || null,
      record.status,
      record.scheduledDate,
      record.completedDate || null,
      record.actualSetsCompleted,
      record.prescribedSetsCount,
      record.actualVolumeKg,
      record.deviationNotes || null,
      new Date().toISOString(),
    ]
  );
}

export function getProgramSessionRecords(
  enrollmentId: string
): ProgramSessionRecord[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>(
    `SELECT * FROM program_session_records WHERE enrollment_id = ? ORDER BY created_at DESC`,
    [enrollmentId]
  );

  return rows.map((r) => ({
    id: r.id,
    enrollmentId: r.enrollment_id,
    programId: r.program_id,
    scheduledSessionId: r.scheduled_session_id,
    workoutSessionId: r.workout_session_id || undefined,
    status: r.status,
    scheduledDate: r.scheduled_date,
    completedDate: r.completed_date || undefined,
    actualSetsCompleted: r.actual_sets_completed,
    prescribedSetsCount: r.prescribed_sets_count,
    actualVolumeKg: r.actual_volume_kg,
    deviationNotes: r.deviation_notes || undefined,
  }));
}

export function saveCustomProgram(program: TrainingProgramDefinition): void {
  const db = getDatabase();
  db.runSync(
    `INSERT OR REPLACE INTO custom_training_programs (
      id, title, program_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?)`,
    [
      program.id,
      program.title,
      JSON.stringify(program),
      new Date().toISOString(),
      new Date().toISOString(),
    ]
  );
}

export function getCustomPrograms(): TrainingProgramDefinition[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>(
    `SELECT * FROM custom_training_programs ORDER BY updated_at DESC`
  );

  return rows.map((r) => {
    try {
      return JSON.parse(r.program_json);
    } catch {
      return null;
    }
  }).filter(Boolean) as TrainingProgramDefinition[];
}

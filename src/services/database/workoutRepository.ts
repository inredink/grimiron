import { getDatabase } from './db';
import {
  WorkoutSession,
  WorkoutExercise,
  ExerciseSet,
  XpBreakdown,
  SetClassification,
} from '../../types/workout';
import { syncTotalXpFromHistory } from './characterRepository';

export function saveCompletedWorkout(
  session: WorkoutSession,
  xpEarned: number,
  breakdown: XpBreakdown
): void {
  const db = getDatabase();

  db.withTransactionSync(() => {
    // 1. Insert or update session
    db.runSync(
      `INSERT OR REPLACE INTO workout_sessions (
        id, title, started_at, finished_at, notes, total_xp_earned, is_completed
      ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        session.id,
        session.title || 'Crusade Training',
        session.startedAt,
        session.finishedAt || new Date().toISOString(),
        session.notes || '',
        xpEarned,
      ]
    );

    // 2. Clean old exercises/sets for this session if updating
    db.runSync('DELETE FROM workout_exercises WHERE session_id = ?', [session.id]);

    // 3. Insert exercises and their sets
    for (let i = 0; i < session.exercises.length; i++) {
      const exercise = session.exercises[i];
      db.runSync(
        `INSERT INTO workout_exercises (id, session_id, exercise_ref_id, name, sort_order, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          exercise.id,
          session.id,
          exercise.exerciseRefId || null,
          exercise.name,
          i,
          exercise.notes || '',
        ]
      );

      for (let j = 0; j < exercise.sets.length; j++) {
        const set = exercise.sets[j];
        db.runSync(
          `INSERT INTO workout_sets (
            id, exercise_id, set_number, reps, weight, unit, is_completed, set_classification
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            set.id,
            exercise.id,
            j + 1,
            Math.max(0, Math.floor(set.reps || 0)),
            Math.max(0, Number(set.weight) || 0),
            set.unit || 'lbs',
            set.isCompleted ? 1 : 0,
            set.setClassification || 'working',
          ]
        );
      }
    }

    // 4. Record XP transaction
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.runSync(
      `INSERT INTO xp_transactions (
        id, session_id, amount, source_type, details_json, created_at
      ) VALUES (?, ?, ?, 'workout_completion', ?, datetime('now'))`,
      [txId, session.id, xpEarned, JSON.stringify(breakdown)]
    );
  });

  // 5. Update character XP from history
  syncTotalXpFromHistory();
}

export function getAllWorkouts(): WorkoutSession[] {
  const db = getDatabase();

  const sessionRows = db.getAllSync<{
    id: string;
    title: string;
    started_at: string;
    finished_at: string | null;
    notes: string | null;
    total_xp_earned: number;
    is_completed: number;
  }>('SELECT * FROM workout_sessions ORDER BY started_at DESC');

  const workouts: WorkoutSession[] = [];

  for (const s of sessionRows) {
    const exerciseRows = db.getAllSync<{
      id: string;
      session_id: string;
      exercise_ref_id: string | null;
      name: string;
      sort_order: number;
      notes: string | null;
    }>(
      'SELECT id, session_id, exercise_ref_id, name, sort_order, notes FROM workout_exercises WHERE session_id = ? ORDER BY sort_order ASC',
      [s.id]
    );

    const exercises: WorkoutExercise[] = [];

    for (const e of exerciseRows) {
      const setRows = db.getAllSync<{
        id: string;
        exercise_id: string;
        set_number: number;
        reps: number;
        weight: number;
        unit: 'lbs' | 'kg';
        is_completed: number;
        set_classification: string | null;
      }>(
        'SELECT id, exercise_id, set_number, reps, weight, unit, is_completed, set_classification FROM workout_sets WHERE exercise_id = ? ORDER BY set_number ASC',
        [e.id]
      );

      exercises.push({
        id: e.id,
        sessionId: e.session_id,
        exerciseRefId: e.exercise_ref_id || undefined,
        name: e.name,
        sortOrder: e.sort_order,
        notes: e.notes || undefined,
        sets: setRows.map((r) => ({
          id: r.id,
          exerciseId: r.exercise_id,
          setNumber: r.set_number,
          reps: r.reps,
          weight: r.weight,
          unit: r.unit,
          isCompleted: Boolean(r.is_completed),
          setClassification: (r.set_classification as SetClassification) || 'working',
        })),
      });
    }

    workouts.push({
      id: s.id,
      title: s.title,
      startedAt: s.started_at,
      finishedAt: s.finished_at || undefined,
      notes: s.notes || undefined,
      totalXpEarned: s.total_xp_earned,
      isCompleted: Boolean(s.is_completed),
      exercises,
    });
  }

  return workouts;
}

export function getWorkoutById(sessionId: string): WorkoutSession | undefined {
  const all = getAllWorkouts();
  return all.find((w) => w.id === sessionId);
}

/**
 * Clones a previous workout into a new active session pre-populated with identical
 * exercises, sets, weights, and reps, but with uncompleted status so the user can easily repeat it.
 */
export function cloneWorkoutForRepeat(sessionId: string): WorkoutSession | null {
  const source = getWorkoutById(sessionId);
  if (!source) return null;

  const newSessionId = `session_${Date.now()}`;

  const clonedExercises: WorkoutExercise[] = source.exercises.map((ex, exIdx) => {
    const newExId = `ex_${Date.now()}_${exIdx}_${Math.random().toString(36).substring(2, 5)}`;
    return {
      id: newExId,
      sessionId: newSessionId,
      exerciseRefId: ex.exerciseRefId,
      name: ex.name,
      sortOrder: ex.sortOrder,
      notes: ex.notes,
      sets: ex.sets.map((set, setIdx) => ({
        id: `set_${Date.now()}_${exIdx}_${setIdx}`,
        exerciseId: newExId,
        setNumber: setIdx + 1,
        reps: set.reps,
        weight: set.weight,
        unit: set.unit,
        isCompleted: false, // Reset for new attempt!
        setClassification: set.setClassification || 'working',
      })),
    };
  });

  return {
    id: newSessionId,
    title: source.title,
    startedAt: new Date().toISOString(),
    totalXpEarned: 0,
    isCompleted: false,
    notes: source.notes,
    exercises: clonedExercises,
  };
}

export function deleteWorkout(sessionId: string): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    // Foreign keys with CASCADE will remove exercises, sets, and transactions
    db.runSync('DELETE FROM workout_sessions WHERE id = ?', [sessionId]);
  });
  syncTotalXpFromHistory();
}

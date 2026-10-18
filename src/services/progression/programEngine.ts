import {
  TrainingProgramDefinition,
  ScheduledProgramSession,
  UserProgramEnrollment,
  ProgramSessionRecord,
  ExercisePerformanceTrend,
} from '../../types/program';
import { WorkoutSession, WorkoutExercise, ExerciseSet } from '../../types/workout';

/**
 * Pure domain logic for Training Programs and Workout Session Generation.
 * Decoupled from native SQLite so it can be verified in Node CLI test suites.
 */

/**
 * Creates a new enrollment record for a character following a training program.
 * Saves an immutable snapshot of the program definition so future catalog edits
 * do not retroactively alter the user's historical plan.
 */
export function createProgramEnrollment(
  characterId: string,
  program: TrainingProgramDefinition
): UserProgramEnrollment {
  const totalPlanned = program.blocks.reduce((acc, b) => {
    return acc + b.sessions.filter((s) => !s.isRestDay).length;
  }, 0);

  return {
    id: `enroll_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    characterId,
    programId: program.id,
    programTitle: program.title,
    programCategory: program.category,
    programSnapshot: JSON.parse(JSON.stringify(program)),
    currentBlockNumber: 1,
    currentSessionIndex: 0,
    status: 'active',
    startedAt: new Date().toISOString(),
    completedSessionsCount: 0,
    totalPlannedSessionsCount: totalPlanned,
    adherencePercent: 0,
  };
}

/**
 * Converts a scheduled program session into a prepopulated WorkoutSession for the logger.
 * IMPORTANT: Planned sets are NEVER marked as completed. They are generated with
 * isCompleted: false so the user must log their actual performance.
 */
export function populateWorkoutFromScheduledSession(
  session: ScheduledProgramSession,
  workoutTitlePrefix: string = 'Crusade Training'
): WorkoutSession {
  const exercises: WorkoutExercise[] = session.exercises.map((presc, exIdx) => {
    const exerciseId = `prog_ex_${Date.now()}_${exIdx}`;
    const sets: ExerciseSet[] = [];

    // Prepopulate the planned number of sets with target reps
    for (let setNum = 1; setNum <= presc.targetSets; setNum++) {
      sets.push({
        id: `set_${exerciseId}_${setNum}`,
        exerciseId,
        setNumber: setNum,
        reps: presc.targetRepsMin || 10,
        weight: 0, // Starts at 0 or empty for user to input actual lifted load
        unit: 'kg',
        isCompleted: false, // CRITICAL: Never marked completed in advance
        setClassification: 'working',
      });
    }

    return {
      id: exerciseId,
      sessionId: `session_prog_${Date.now()}`,
      exerciseRefId: presc.exerciseRefId,
      name: presc.exerciseName,
      sortOrder: presc.sortOrder,
      notes: presc.notes
        ? `[PLAN: ${presc.targetSets}×${presc.targetRepsMin}-${presc.targetRepsMax} | Rest: ${presc.restIntervalSeconds || 90}s] ${presc.notes}`
        : `[PLAN: ${presc.targetSets}×${presc.targetRepsMin}-${presc.targetRepsMax} reps]`,
      sets,
    };
  });

  return {
    id: `session_prog_${Date.now()}`,
    title: `${workoutTitlePrefix}: ${session.title}`,
    startedAt: new Date().toISOString(),
    totalXpEarned: 0,
    isCompleted: false,
    notes: session.focus ? `Focus: ${session.focus}` : undefined,
    exercises,
  };
}

/**
 * Evaluates session adherence between the scheduled prescription and actual workout.
 * Distinguishes planned vs completed vs partial sessions, noting deviations without penalty.
 */
export function evaluateSessionAdherence(
  scheduledSession: ScheduledProgramSession,
  actualWorkout: WorkoutSession,
  enrollmentId: string
): ProgramSessionRecord {
  const prescribedSetsCount = scheduledSession.exercises.reduce(
    (acc, e) => acc + e.targetSets,
    0
  );

  let actualSetsCompleted = 0;
  let actualVolumeKg = 0;

  for (const ex of actualWorkout.exercises) {
    for (const s of ex.sets) {
      if (s.isCompleted) {
        actualSetsCompleted++;
        actualVolumeKg += s.reps * (s.weight || 0);
      }
    }
  }

  let status: 'completed' | 'partial' | 'skipped' = 'completed';
  if (actualSetsCompleted === 0) {
    status = 'skipped';
  } else if (actualSetsCompleted < prescribedSetsCount) {
    status = 'partial';
  }

  const deviationNotes: string[] = [];
  if (actualSetsCompleted !== prescribedSetsCount) {
    deviationNotes.push(
      `Performed ${actualSetsCompleted} / ${prescribedSetsCount} prescribed sets.`
    );
  }

  return {
    id: `prec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    enrollmentId,
    programId: scheduledSession.id.split('_')[0],
    scheduledSessionId: scheduledSession.id,
    workoutSessionId: actualWorkout.id,
    status,
    scheduledDate: actualWorkout.startedAt,
    completedDate: actualWorkout.finishedAt || new Date().toISOString(),
    actualSetsCompleted,
    prescribedSetsCount,
    actualVolumeKg,
    deviationNotes: deviationNotes.join(' '),
  };
}

/**
 * Advances the enrollment to the next session index or next training block.
 */
export function advanceEnrollmentSession(
  enrollment: UserProgramEnrollment,
  wasCompleted: boolean = true
): UserProgramEnrollment {
  const currentBlock = enrollment.programSnapshot.blocks.find(
    (b) => b.blockNumber === enrollment.currentBlockNumber
  ) || enrollment.programSnapshot.blocks[0];

  const totalSessionsInBlock = currentBlock.sessions.length;
  let nextSessionIndex = enrollment.currentSessionIndex + 1;
  let nextBlockNumber = enrollment.currentBlockNumber;
  let status = enrollment.status;

  if (nextSessionIndex >= totalSessionsInBlock) {
    // Check if next block exists
    const nextBlock = enrollment.programSnapshot.blocks.find(
      (b) => b.blockNumber === enrollment.currentBlockNumber + 1
    );
    if (nextBlock) {
      nextBlockNumber = nextBlock.blockNumber;
      nextSessionIndex = 0;
    } else {
      // Completed entire program
      status = 'completed';
    }
  }

  const completedCount = wasCompleted
    ? enrollment.completedSessionsCount + 1
    : enrollment.completedSessionsCount;

  const adherence =
    enrollment.totalPlannedSessionsCount > 0
      ? Math.min(
          100,
          Math.round((completedCount / enrollment.totalPlannedSessionsCount) * 100)
        )
      : 0;

  return {
    ...enrollment,
    currentBlockNumber: nextBlockNumber,
    currentSessionIndex: nextSessionIndex,
    completedSessionsCount: completedCount,
    adherencePercent: adherence,
    lastSessionAt: new Date().toISOString(),
    status,
  };
}

/**
 * Computes exercise-level progression trends across historical workouts.
 * Uses the Brzycki formula: 1RM = Weight × (36 / (37 - Reps)) for reps <= 10.
 */
export function calculateExercisePerformanceTrends(
  workoutSessions: WorkoutSession[]
): Record<string, ExercisePerformanceTrend> {
  const trends: Record<string, ExercisePerformanceTrend> = {};

  for (const session of workoutSessions) {
    if (!session.isCompleted) continue;
    for (const ex of session.exercises) {
      const refId = ex.exerciseRefId || ex.name.toLowerCase().replace(/\s+/g, '_');
      for (const s of ex.sets) {
        if (!s.isCompleted || s.reps <= 0 || s.weight <= 0) continue;

        const weightKg = s.unit === 'lbs' ? s.weight * 0.453592 : s.weight;
        const est1RM =
          s.reps === 1
            ? weightKg
            : s.reps <= 10
            ? Math.round(weightKg * (36 / (37 - s.reps)))
            : Math.round(weightKg * (1 + s.reps / 30));

        if (!trends[refId]) {
          trends[refId] = {
            exerciseRefId: refId,
            exerciseName: ex.name,
            lastWeightKg: Math.round(weightKg),
            lastReps: s.reps,
            estimated1RM: est1RM,
            sessionsLogged: 1,
            bestWeightKg: Math.round(weightKg),
          };
        } else {
          trends[refId].sessionsLogged++;
          trends[refId].lastWeightKg = Math.round(weightKg);
          trends[refId].lastReps = s.reps;
          trends[refId].bestWeightKg = Math.max(
            trends[refId].bestWeightKg,
            Math.round(weightKg)
          );
          trends[refId].estimated1RM = Math.max(
            trends[refId].estimated1RM,
            est1RM
          );
        }
      }
    }
  }

  return trends;
}

import { ExerciseDefinition } from './exercise';

export type ProgramCategory =
  | 'gvt'
  | 'ppl'
  | 'upper_lower'
  | 'full_body'
  | 'strength_5x5'
  | 'hypertrophy'
  | 'calisthenics'
  | 'custom';

export type TrainingEmphasis =
  | 'strength'
  | 'hypertrophy'
  | 'endurance'
  | 'conditioning'
  | 'power'
  | 'hybrid';

export type ProgramDifficulty = 'novice' | 'intermediate' | 'advanced' | 'veteran';

export type ProgramSessionStatus = 'planned' | 'completed' | 'skipped' | 'partial' | 'rescheduled';

export interface ExercisePrescription {
  id: string;
  exerciseRefId: string;
  exerciseName: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRpe?: number;
  targetWeightPercent?: number; // e.g., 60% 1RM for GVT, 80% for 5x5
  restIntervalSeconds?: number;
  tempo?: string; // e.g. "4-0-2-0" for classic GVT
  notes?: string;
  substituteExerciseIds?: string[];
  sortOrder: number;
}

export interface ScheduledProgramSession {
  id: string;
  sessionIndex: number;
  dayNumber: number; // Day 1, Day 2, etc.
  title: string;
  focus: string; // e.g. "Chest & Back Antagonist", "Push Strength"
  isRestDay: boolean;
  warmupNotes?: string;
  cooldownNotes?: string;
  exercises: ExercisePrescription[];
  estimatedDurationMinutes?: number;
}

export interface TrainingBlock {
  blockNumber: number;
  title: string;
  focus: string;
  durationWeeks: number;
  sessions: ScheduledProgramSession[];
  deloadWeek?: boolean;
}

export interface TrainingProgramDefinition {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  category: ProgramCategory;
  difficulty: ProgramDifficulty;
  trainingEmphasis: TrainingEmphasis;
  durationWeeks: number;
  frequencyDaysPerWeek: number;
  blocks: TrainingBlock[];
  isCanonical: boolean;
  sourceNote: string;
  customizable: boolean;
  iconName: string;
  tags: string[];
}

export interface UserProgramEnrollment {
  id: string;
  characterId: string;
  programId: string;
  programTitle: string;
  programCategory: ProgramCategory;
  programSnapshot: TrainingProgramDefinition;
  currentBlockNumber: number;
  currentSessionIndex: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  startedAt: string;
  lastSessionAt?: string;
  completedSessionsCount: number;
  totalPlannedSessionsCount: number;
  adherencePercent: number;
}

export interface ProgramSessionRecord {
  id: string;
  enrollmentId: string;
  programId: string;
  scheduledSessionId: string;
  workoutSessionId?: string;
  status: ProgramSessionStatus;
  scheduledDate: string;
  completedDate?: string;
  deviationNotes?: string;
  actualSetsCompleted: number;
  prescribedSetsCount: number;
  actualVolumeKg: number;
}

export interface ExercisePerformanceTrend {
  exerciseRefId: string;
  exerciseName: string;
  lastWeightKg: number;
  lastReps: number;
  estimated1RM: number;
  sessionsLogged: number;
  bestWeightKg: number;
}

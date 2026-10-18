export type WeightUnit = 'lbs' | 'kg';

export type SetClassification = 'working' | 'warmup' | 'dropset';

export interface ExerciseSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  unit: WeightUnit;
  isCompleted: boolean;
  setClassification?: SetClassification;
}

export interface WorkoutExercise {
  id: string;
  sessionId: string;
  exerciseRefId?: string; // links to catalog or custom exercise id
  name: string;
  sortOrder: number;
  notes?: string;
  sets: ExerciseSet[];
}

export interface WorkoutSession {
  id: string;
  title: string;
  startedAt: string;
  finishedAt?: string;
  notes?: string;
  totalXpEarned: number;
  isCompleted: boolean;
  exercises: WorkoutExercise[];
}

export interface XpBreakdown {
  baseWorkoutXp: number;
  completedSetsXp: number;
  repsXp: number;
  volumeXp: number;
  totalXp: number;
}

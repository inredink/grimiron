export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'traps'
  | 'full_body';

export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'bodyweight'
  | 'cable'
  | 'machine'
  | 'kettlebell'
  | 'resistance_band'
  | 'smith_machine'
  | 'other';

export type MovementPattern =
  | 'push'
  | 'pull'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'carry'
  | 'isolation';

export type ExerciseCategory =
  | 'strength'
  | 'hypertrophy'
  | 'calisthenics'
  | 'powerlifting'
  | 'olympic'
  | 'endurance'
  | 'mobility';

export interface ExerciseDefinition {
  id: string; // stable identifier, e.g. 'ex_barbell_bench_press'
  name: string;
  aliases: string[]; // e.g. ['flat bench', 'bb bench']
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  movementPattern: MovementPattern;
  category: ExerciseCategory;
  isCustom?: boolean;
  isFavorite?: boolean;
}

export interface ExerciseFilterOptions {
  searchQuery?: string;
  muscleGroup?: MuscleGroup | 'all';
  equipment?: EquipmentType | 'all';
  onlyFavorites?: boolean;
}

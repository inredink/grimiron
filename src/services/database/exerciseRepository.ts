import { getDatabase } from './db';
import {
  ExerciseDefinition,
  ExerciseFilterOptions,
  MuscleGroup,
  EquipmentType,
} from '../../types/exercise';
import { EXERCISE_CATALOG } from '../../content/exercises/catalog';

interface CustomExerciseRow {
  id: string;
  name: string;
  aliases_json: string | null;
  primary_muscle: string;
  secondary_muscles_json: string | null;
  equipment: string;
  movement_pattern: string;
  category: string;
  created_at: string;
}

/**
 * Returns all favorite exercise IDs stored in SQLite.
 */
export function getFavoriteExerciseIds(): Set<string> {
  const db = getDatabase();
  const rows = db.getAllSync<{ exercise_id: string }>(
    'SELECT exercise_id FROM exercise_favorites'
  );
  return new Set(rows.map((r) => r.exercise_id));
}

/**
 * Toggles the favorite status of any exercise (built-in or custom).
 */
export function toggleFavoriteExercise(exerciseId: string): boolean {
  const db = getDatabase();
  const existing = db.getFirstSync<{ exercise_id: string }>(
    'SELECT exercise_id FROM exercise_favorites WHERE exercise_id = ?',
    [exerciseId]
  );

  if (existing) {
    db.runSync('DELETE FROM exercise_favorites WHERE exercise_id = ?', [exerciseId]);
    return false;
  } else {
    db.runSync(
      'INSERT INTO exercise_favorites (exercise_id, created_at) VALUES (?, datetime("now"))',
      [exerciseId]
    );
    return true;
  }
}

/**
 * Retrieves all user-created custom exercises from SQLite.
 */
export function getCustomExercises(): ExerciseDefinition[] {
  const db = getDatabase();
  const rows = db.getAllSync<CustomExerciseRow>('SELECT * FROM custom_exercises ORDER BY name ASC');

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    aliases: r.aliases_json ? JSON.parse(r.aliases_json) : [],
    primaryMuscle: r.primary_muscle as MuscleGroup,
    secondaryMuscles: r.secondary_muscles_json ? JSON.parse(r.secondary_muscles_json) : [],
    equipment: r.equipment as EquipmentType,
    movementPattern: r.movement_pattern as any,
    category: r.category as any,
    isCustom: true,
  }));
}

/**
 * Creates and persists a new custom exercise in SQLite.
 */
export function createCustomExercise(
  exercise: Omit<ExerciseDefinition, 'id' | 'isCustom' | 'isFavorite'>
): ExerciseDefinition {
  const db = getDatabase();
  const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO custom_exercises (
      id, name, aliases_json, primary_muscle, secondary_muscles_json, equipment, movement_pattern, category, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      exercise.name.trim(),
      JSON.stringify(exercise.aliases || []),
      exercise.primaryMuscle,
      JSON.stringify(exercise.secondaryMuscles || []),
      exercise.equipment,
      exercise.movementPattern,
      exercise.category,
      now,
    ]
  );

  return {
    ...exercise,
    id,
    isCustom: true,
    isFavorite: false,
  };
}

/**
 * Combines built-in catalog exercises and custom exercises, decorated with favorite status.
 */
export function getAllExercises(): ExerciseDefinition[] {
  const favorites = getFavoriteExerciseIds();
  const customExercises = getCustomExercises();

  // Combine built-in with custom
  const all = [...EXERCISE_CATALOG, ...customExercises];

  return all.map((ex) => ({
    ...ex,
    isFavorite: favorites.has(ex.id),
  }));
}

/**
 * Finds an exercise by its stable ID across both catalog and custom entries.
 */
export function getExerciseById(id: string): ExerciseDefinition | undefined {
  return getAllExercises().find((e) => e.id === id);
}

/**
 * Search and filter exercises with support for text queries, muscle groups, equipment, and favorites.
 */
export function searchAndFilterExercises(
  options: ExerciseFilterOptions
): ExerciseDefinition[] {
  const exercises = getAllExercises();
  const { searchQuery, muscleGroup, equipment, onlyFavorites } = options;

  return exercises.filter((ex) => {
    // Favorites filter
    if (onlyFavorites && !ex.isFavorite) {
      return false;
    }

    // Muscle group filter
    if (muscleGroup && muscleGroup !== 'all') {
      const matchesPrimary = ex.primaryMuscle === muscleGroup;
      const matchesSecondary = ex.secondaryMuscles.includes(muscleGroup);
      if (!matchesPrimary && !matchesSecondary) {
        return false;
      }
    }

    // Equipment filter
    if (equipment && equipment !== 'all') {
      if (ex.equipment !== equipment) {
        return false;
      }
    }

    // Text search query
    if (searchQuery && searchQuery.trim()) {
      const cleanQuery = searchQuery.trim().toLowerCase();
      const matchesName = ex.name.toLowerCase().includes(cleanQuery);
      const matchesAliases = ex.aliases.some((alias) =>
        alias.toLowerCase().includes(cleanQuery)
      );
      const matchesMuscle = ex.primaryMuscle.toLowerCase().includes(cleanQuery);
      const matchesEquipment = ex.equipment.toLowerCase().includes(cleanQuery);

      if (!matchesName && !matchesAliases && !matchesMuscle && !matchesEquipment) {
        return false;
      }
    }

    return true;
  });
}

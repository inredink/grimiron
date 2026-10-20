import { getDatabase } from './db';
import {
  DiagnosticsDataProvider,
  setDiagnosticsDataProvider,
} from '../diagnostics/diagnosticsService';

export const sqliteDiagnosticsProvider: DiagnosticsDataProvider = {
  getCounts: () => {
    let workouts = 0;
    let setsCompleted = 0;
    let volumeLbs = 0;
    let subfactions = 0;
    let achievements = 0;
    let characterSummary = 'Level 1 Battle-Brother';
    let dbStatus = 'ONLINE (SQLite WAL)';

    try {
      const db = getDatabase();
      const wRow = db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM workout_sessions;'
      );
      workouts = wRow?.count || 0;

      const setRow = db.getFirstSync<{ count: number; vol: number }>(
        'SELECT COUNT(*) as count, COALESCE(SUM(weight_lbs * reps), 0) as vol FROM workout_sets WHERE completed = 1;'
      );
      setsCompleted = setRow?.count || 0;
      volumeLbs = Math.round(setRow?.vol || 0);

      const sRow = db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM custom_subfactions;'
      );
      subfactions = sRow?.count || 0;

      const aRow = db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM achievement_awards;'
      );
      achievements = aRow?.count || 0;

      const charRow = db.getFirstSync<{ character_name: string; current_level: number; total_xp: number }>(
        'SELECT character_name, current_level, total_xp FROM character_profile LIMIT 1;'
      );
      if (charRow) {
        characterSummary = `Level ${charRow.current_level} "${charRow.character_name}" (${charRow.total_xp} XP)`;
      }
    } catch (err: any) {
      dbStatus = `ERROR: ${err?.message || 'Database query error'}`;
    }

    return {
      workouts,
      setsCompleted,
      volumeLbs,
      subfactions,
      achievements,
      characterSummary,
      dbStatus,
    };
  },
};

export function initializeDiagnosticsSqliteProvider(): void {
  setDiagnosticsDataProvider(sqliteDiagnosticsProvider);
}

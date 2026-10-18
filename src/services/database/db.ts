import * as SQLite from 'expo-sqlite';

let databaseInstance: SQLite.SQLiteDatabase | null = null;

export const DB_NAME = 'grimiron.db';

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!databaseInstance) {
    databaseInstance = SQLite.openDatabaseSync(DB_NAME);
  }
  return databaseInstance;
}

/**
 * Executes migrations sequentially to safeguard user data across app updates.
 */
export function initializeDatabase(): SQLite.SQLiteDatabase {
  const db = getDatabase();

  // Enable foreign keys and WAL mode for reliability and performance
  db.execSync('PRAGMA foreign_keys = ON;');
  db.execSync('PRAGMA journal_mode = WAL;');

  // Migration tracking table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedMigrations = db.getAllSync<{ version: number }>(
    'SELECT version FROM schema_migrations'
  ).map((row) => row.version);

  // Migration 1: Core initial schema
  if (!appliedMigrations.includes(1)) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS character_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        universe_id TEXT NOT NULL DEFAULT 'warhammer40k',
        faction_id TEXT NOT NULL DEFAULT 'adeptus-astartes',
        subfaction_id TEXT DEFAULT 'ultramarines',
        character_name TEXT NOT NULL DEFAULT 'Battle-Brother',
        total_xp INTEGER NOT NULL DEFAULT 0,
        current_level INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workout_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        notes TEXT,
        total_xp_earned INTEGER NOT NULL DEFAULT 0,
        is_completed INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS workout_exercises (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (session_id) REFERENCES workout_sessions (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS workout_sets (
        id TEXT PRIMARY KEY,
        exercise_id TEXT NOT NULL,
        set_number INTEGER NOT NULL,
        reps INTEGER NOT NULL DEFAULT 0,
        weight REAL NOT NULL DEFAULT 0,
        unit TEXT NOT NULL DEFAULT 'lbs',
        is_completed INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (exercise_id) REFERENCES workout_exercises (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS xp_transactions (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        amount INTEGER NOT NULL,
        source_type TEXT NOT NULL,
        details_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES workout_sessions (id) ON DELETE CASCADE
      );

      -- Default character profile initialization
      INSERT OR IGNORE INTO character_profile (
        id, universe_id, faction_id, subfaction_id, character_name, total_xp, current_level, created_at, updated_at
      ) VALUES (
        1, 'warhammer40k', 'adeptus-astartes', 'ultramarines', 'Battle-Brother', 0, 1, datetime('now'), datetime('now')
      );

      INSERT INTO schema_migrations (version, applied_at) VALUES (1, datetime('now'));
    `);
  }

  // Migration 2: Custom exercises, favorites, and set classifications
  if (!appliedMigrations.includes(2)) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS custom_exercises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        aliases_json TEXT,
        primary_muscle TEXT NOT NULL,
        secondary_muscles_json TEXT,
        equipment TEXT NOT NULL,
        movement_pattern TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS exercise_favorites (
        exercise_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL
      );
    `);

    // Add optional columns safely to existing workout tables
    try {
      db.execSync('ALTER TABLE workout_exercises ADD COLUMN exercise_ref_id TEXT;');
    } catch {
      // Column might already exist if re-running
    }

    try {
      db.execSync("ALTER TABLE workout_sets ADD COLUMN set_classification TEXT NOT NULL DEFAULT 'working';");
    } catch {
      // Column might already exist
    }

    db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (2, datetime('now'));");
  }

  // Migration 3: Solo Combat Encounters and Mission Records
  if (!appliedMigrations.includes(3)) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS combat_encounters (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        mission_id TEXT NOT NULL,
        enemy_id TEXT NOT NULL,
        enemy_name TEXT NOT NULL,
        enemy_max_hp INTEGER NOT NULL,
        enemy_remaining_hp INTEGER NOT NULL,
        total_damage INTEGER NOT NULL,
        is_defeated INTEGER NOT NULL DEFAULT 0,
        attacks_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES workout_sessions (id) ON DELETE CASCADE
      );
    `);

    db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (3, datetime('now'));");
  }

  // Migration 4: Offline Cooperative Attack Queue and Active Raid state
  if (!appliedMigrations.includes(4)) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS coop_attack_queue (
        id TEXT PRIMARY KEY,
        group_boss_id TEXT NOT NULL,
        client_set_id TEXT NOT NULL UNIQUE,
        exercise_name TEXT NOT NULL,
        attack_name TEXT NOT NULL,
        style_name TEXT NOT NULL,
        damage INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        synced_at TEXT,
        sync_error TEXT
      );

      CREATE TABLE IF NOT EXISTS coop_active_raid (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        group_id TEXT NOT NULL,
        group_name TEXT NOT NULL,
        boss_id TEXT NOT NULL,
        boss_name TEXT NOT NULL,
        boss_faction TEXT NOT NULL,
        boss_lore TEXT NOT NULL,
        boss_glyph TEXT NOT NULL,
        boss_max_hp INTEGER NOT NULL,
        boss_current_hp INTEGER NOT NULL,
        is_defeated INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `);

    db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (4, datetime('now'));");
  }

  return db;
}



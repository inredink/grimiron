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

  // Migration 5: Battle History & Persistent Achievement System
  if (!appliedMigrations.includes(5)) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS battle_history (
        id TEXT PRIMARY KEY,
        encounter_mode TEXT NOT NULL,
        session_id TEXT,
        mission_id TEXT,
        mission_title TEXT NOT NULL,
        enemy_id TEXT NOT NULL,
        enemy_name TEXT NOT NULL,
        enemy_faction TEXT,
        enemy_difficulty TEXT,
        enemy_max_hp INTEGER NOT NULL,
        enemy_remaining_hp INTEGER NOT NULL,
        outcome TEXT NOT NULL,
        total_damage INTEGER NOT NULL DEFAULT 0,
        total_attacks INTEGER NOT NULL DEFAULT 0,
        participant_count INTEGER NOT NULL DEFAULT 1,
        squad_id TEXT,
        squad_name TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        duration_seconds INTEGER,
        xp_earned INTEGER NOT NULL DEFAULT 0,
        snapshot_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES workout_sessions (id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS battle_participants (
        id TEXT PRIMARY KEY,
        battle_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        callsign TEXT NOT NULL,
        faction_id TEXT NOT NULL,
        subfaction_id TEXT,
        attacks_count INTEGER NOT NULL DEFAULT 0,
        damage_dealt INTEGER NOT NULL DEFAULT 0,
        damage_share_percent REAL NOT NULL DEFAULT 0,
        workouts_attributed INTEGER NOT NULL DEFAULT 1,
        sets_attributed INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (battle_id) REFERENCES battle_history (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS achievement_awards (
        id TEXT PRIMARY KEY,
        achievement_id TEXT NOT NULL,
        scope TEXT NOT NULL,
        target_id TEXT NOT NULL,
        tier INTEGER NOT NULL DEFAULT 1,
        unlocked_at TEXT NOT NULL,
        source_event_type TEXT NOT NULL,
        source_ref_id TEXT,
        reward_xp INTEGER NOT NULL DEFAULT 0,
        reward_claimed INTEGER NOT NULL DEFAULT 1,
        CONSTRAINT uq_ach_award UNIQUE (achievement_id, scope, target_id)
      );

      CREATE TABLE IF NOT EXISTS achievement_progress (
        id TEXT PRIMARY KEY,
        achievement_id TEXT NOT NULL,
        scope TEXT NOT NULL,
        target_id TEXT NOT NULL,
        current_value REAL NOT NULL DEFAULT 0,
        target_value REAL NOT NULL DEFAULT 1,
        is_completed INTEGER NOT NULL DEFAULT 0,
        last_updated_at TEXT NOT NULL,
        CONSTRAINT uq_ach_progress UNIQUE (achievement_id, scope, target_id)
      );

      CREATE TABLE IF NOT EXISTS pending_notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        details_json TEXT,
        created_at TEXT NOT NULL,
        is_dismissed INTEGER NOT NULL DEFAULT 0
      );
    `);

    db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (5, datetime('now'));");
  }

  // Migration 6: Faction Missions & Objective Tracking
  if (!appliedMigrations.includes(6)) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS mission_progress (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        faction_id TEXT NOT NULL,
        subfaction_id TEXT,
        character_id TEXT NOT NULL DEFAULT 'char_main',
        status TEXT NOT NULL DEFAULT 'available',
        objectives_json TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        rewards_json TEXT NOT NULL,
        is_claimed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        CONSTRAINT uq_char_mission UNIQUE (character_id, mission_id)
      );
    `);

    db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (6, datetime('now'));");
  }

  // Migration 7: Training Programs, Program Sessions, and Campaign Node Progress
  if (!appliedMigrations.includes(7)) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS user_programs (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL DEFAULT 'char_main',
        program_id TEXT NOT NULL,
        program_title TEXT NOT NULL,
        program_category TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        current_block_number INTEGER NOT NULL DEFAULT 1,
        current_session_index INTEGER NOT NULL DEFAULT 0,
        program_snapshot_json TEXT NOT NULL,
        started_at TEXT NOT NULL,
        last_session_at TEXT,
        completed_sessions_count INTEGER NOT NULL DEFAULT 0,
        total_planned_sessions_count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS program_session_records (
        id TEXT PRIMARY KEY,
        enrollment_id TEXT NOT NULL,
        program_id TEXT NOT NULL,
        scheduled_session_id TEXT NOT NULL,
        workout_session_id TEXT,
        status TEXT NOT NULL DEFAULT 'completed',
        scheduled_date TEXT NOT NULL,
        completed_date TEXT,
        actual_sets_completed INTEGER NOT NULL DEFAULT 0,
        prescribed_sets_count INTEGER NOT NULL DEFAULT 0,
        actual_volume_kg REAL NOT NULL DEFAULT 0,
        deviation_notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (enrollment_id) REFERENCES user_programs (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS campaign_node_progress (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL DEFAULT 'char_main',
        campaign_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'locked',
        completed_at TEXT,
        unlocked_at TEXT,
        requirements_status_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        CONSTRAINT uq_char_camp_node UNIQUE (character_id, campaign_id, node_id)
      );

      CREATE TABLE IF NOT EXISTS custom_training_programs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        program_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (7, datetime('now'));");
  }

  // Migration 8: Warfront Daily Engagements, Weekly Raids, and Encounter History
  if (!appliedMigrations.includes(8)) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS daily_rotations (
        rotation_date TEXT PRIMARY KEY,
        offered_ids_json TEXT NOT NULL,
        completed_ids_json TEXT NOT NULL DEFAULT '[]',
        active_encounter_id TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS weekly_raids (
        cycle_id TEXT PRIMARY KEY,
        scope TEXT NOT NULL,
        squad_id TEXT,
        boss_data_json TEXT NOT NULL,
        max_hp INTEGER NOT NULL,
        current_hp INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        spawn_day TEXT NOT NULL DEFAULT 'friday',
        started_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        rewards_claimed INTEGER NOT NULL DEFAULT 0,
        contributions_json TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recent_encounters_history (
        encounter_id TEXT PRIMARY KEY,
        selected_date TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS warfront_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        preferred_spawn_day TEXT NOT NULL DEFAULT 'friday',
        updated_at TEXT NOT NULL
      );

      INSERT OR IGNORE INTO warfront_settings (id, preferred_spawn_day, updated_at)
      VALUES (1, 'friday', datetime('now'));
    `);

    db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (8, datetime('now'));");
  }

  // Migration 9: In-Progress Workout Draft Persistence for Crash Recovery
  if (!appliedMigrations.includes(9)) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS active_workout_draft (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        workout_json TEXT NOT NULL,
        mission_json TEXT,
        daily_encounter_id TEXT,
        raid_cycle_id TEXT,
        updated_at TEXT NOT NULL
      );
    `);

    db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (9, datetime('now'));");
  }

  // Migration 10: Weekly Raid Boss History & Saturday Spawn Day Preference
  if (!appliedMigrations.includes(10)) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS recent_raid_bosses (
        cycle_id TEXT PRIMARY KEY,
        boss_key TEXT NOT NULL,
        archetype_id TEXT NOT NULL,
        faction_id TEXT NOT NULL,
        boss_name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      UPDATE warfront_settings
      SET preferred_spawn_day = 'saturday', updated_at = datetime('now')
      WHERE id = 1 AND preferred_spawn_day = 'friday';
    `);

    db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (10, datetime('now'));");
  }

  // Migration 11: Slain Named Enemies Tracking & Immersion Filter
  if (!appliedMigrations.includes(11)) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS slain_named_enemies (
        enemy_name TEXT PRIMARY KEY,
        enemy_id TEXT,
        faction_id TEXT,
        slain_at TEXT NOT NULL,
        battle_id TEXT
      );

      -- Backfill from previous victories in battle_history
      INSERT OR IGNORE INTO slain_named_enemies (enemy_name, enemy_id, faction_id, slain_at, battle_id)
      SELECT enemy_name, enemy_id, enemy_faction, completed_at, id
      FROM battle_history
      WHERE outcome = 'victory' AND enemy_name IS NOT NULL AND TRIM(enemy_name) != '';

      -- Backfill from previous victories in weekly_raids
      INSERT OR IGNORE INTO slain_named_enemies (enemy_name, enemy_id, faction_id, slain_at, battle_id)
      SELECT json_extract(boss_data_json, '$.name'), cycle_id, json_extract(boss_data_json, '$.factionId'), updated_at, cycle_id
      FROM weekly_raids
      WHERE status = 'defeated' AND json_extract(boss_data_json, '$.name') IS NOT NULL;
    `);

    db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (11, datetime('now'));");
  }

  return db;
}



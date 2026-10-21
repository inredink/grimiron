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
 * Safely adds a column to an existing table if it does not already exist.
 */
function ensureColumnExists(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string
): void {
  try {
    const columns = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table});`);
    if (columns.length > 0 && !columns.some((c) => c.name === column)) {
      db.execSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
    }
  } catch {}
}

/**
 * Safely executes a CREATE INDEX or DDL statement without failing database initialization.
 */
function safeCreateIndex(db: SQLite.SQLiteDatabase, indexSql: string): void {
  try {
    db.execSync(indexSql);
  } catch {}
}

/**
 * Ensures a table exists with all required columns.
 * If the table exists but is missing critical columns:
 * - If table has 0 rows, it drops the obsolete table and recreates with correct schema.
 * - If table has rows, it alters the table to safely add any missing columns.
 */
function repairOrRecreateTable(
  db: SQLite.SQLiteDatabase,
  table: string,
  requiredColumns: { name: string; definition: string }[],
  createSql: string
): void {
  try {
    const cols = db.getAllSync<{ name: string }>(`PRAGMA table_info(${table});`);
    if (cols.length === 0) {
      db.execSync(createSql);
      return;
    }
    const colNames = cols.map((c) => c.name);
    const hasMissing = requiredColumns.some((req) => !colNames.includes(req.name));
    if (hasMissing) {
      let rowCount = 0;
      try {
        rowCount = db.getFirstSync<{ count: number }>(`SELECT COUNT(*) as count FROM ${table};`)?.count || 0;
      } catch {
        rowCount = 0;
      }

      if (rowCount === 0) {
        db.execSync(`DROP TABLE IF EXISTS ${table};`);
        db.execSync(createSql);
      } else {
        for (const req of requiredColumns) {
          if (!colNames.includes(req.name)) {
            try {
              db.execSync(`ALTER TABLE ${table} ADD COLUMN ${req.name} ${req.definition};`);
            } catch {}
          }
        }
      }
    }
  } catch (err) {
    console.warn(`repairOrRecreateTable warning on ${table}:`, err);
  }
}

/**
 * Ensures all core application tables exist idempotently.
 * This guarantees that even if a device's schema_migrations table contains
 * an inconsistent version record from a past build, no queries or migrations
 * will fail due to missing tables.
 */
function ensureAllTablesExist(db: SQLite.SQLiteDatabase): void {
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
      exercise_ref_id TEXT,
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
      set_classification TEXT NOT NULL DEFAULT 'working',
      FOREIGN KEY (exercise_id) REFERENCES workout_exercises (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS xp_transactions (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      amount INTEGER NOT NULL,
      source_type TEXT NOT NULL,
      details_json TEXT,
      created_at TEXT NOT NULL,
      user_id TEXT DEFAULT 'user_main',
      character_id TEXT DEFAULT 'char_main',
      requested_amount INTEGER DEFAULT 0,
      calendar_day TEXT,
      is_capped INTEGER DEFAULT 1,
      reason TEXT,
      idempotency_key TEXT,
      FOREIGN KEY (session_id) REFERENCES workout_sessions (id) ON DELETE CASCADE
    );

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
      created_at TEXT NOT NULL
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
      sets_attributed INTEGER NOT NULL DEFAULT 0
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
      reward_claimed INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS achievement_progress (
      id TEXT PRIMARY KEY,
      achievement_id TEXT NOT NULL,
      scope TEXT NOT NULL,
      target_id TEXT NOT NULL,
      current_value REAL NOT NULL DEFAULT 0,
      target_value REAL NOT NULL DEFAULT 1,
      is_completed INTEGER NOT NULL DEFAULT 0,
      last_updated_at TEXT NOT NULL
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
      created_at TEXT NOT NULL
    );

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
      created_at TEXT NOT NULL
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
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_training_programs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      program_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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
      spawn_day TEXT NOT NULL DEFAULT 'saturday',
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
      preferred_spawn_day TEXT NOT NULL DEFAULT 'saturday',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS active_workout_draft (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      workout_json TEXT NOT NULL,
      mission_json TEXT,
      daily_encounter_id TEXT,
      raid_cycle_id TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recent_raid_bosses (
      cycle_id TEXT PRIMARY KEY,
      boss_key TEXT NOT NULL,
      archetype_id TEXT NOT NULL,
      faction_id TEXT NOT NULL,
      boss_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS slain_named_enemies (
      enemy_name TEXT PRIMARY KEY,
      enemy_id TEXT,
      faction_id TEXT,
      slain_at TEXT NOT NULL,
      battle_id TEXT
    );

    CREATE TABLE IF NOT EXISTS campaign_academy_enrollments (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL DEFAULT 'char_main',
      campaign_id TEXT NOT NULL,
      campaign_title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      current_phase_number INTEGER NOT NULL DEFAULT 1,
      current_chapter_number INTEGER NOT NULL DEFAULT 1,
      active_program_enrollment_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      paused_at TEXT,
      resumed_at TEXT,
      completed_at TEXT,
      completed_chapter_ids_json TEXT NOT NULL DEFAULT '[]',
      completed_quest_ids_json TEXT NOT NULL DEFAULT '[]',
      unlocked_boss_chapter_ids_json TEXT NOT NULL DEFAULT '[]',
      defeated_boss_chapter_ids_json TEXT NOT NULL DEFAULT '[]',
      phase1_report_claimed INTEGER NOT NULL DEFAULT 0,
      phase2_report_claimed INTEGER NOT NULL DEFAULT 0,
      phase3_report_claimed INTEGER NOT NULL DEFAULT 0,
      final_dossier_claimed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campaign_phase_reports (
      id TEXT PRIMARY KEY,
      enrollment_id TEXT NOT NULL,
      campaign_id TEXT NOT NULL,
      phase_number INTEGER NOT NULL,
      phase_title TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      sessions_completed INTEGER NOT NULL,
      total_volume_kg REAL NOT NULL,
      total_working_sets INTEGER NOT NULL,
      boss_defeated_name TEXT NOT NULL,
      xp_earned INTEGER NOT NULL,
      summary_notes_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campaign_final_dossiers (
      id TEXT PRIMARY KEY,
      enrollment_id TEXT NOT NULL,
      campaign_id TEXT NOT NULL,
      campaign_title TEXT NOT NULL,
      experience_level TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      total_sessions_completed INTEGER NOT NULL,
      total_planned_sessions INTEGER NOT NULL,
      total_volume_kg REAL NOT NULL,
      total_working_sets INTEGER NOT NULL,
      chapters_completed_count INTEGER NOT NULL,
      quests_completed_count INTEGER NOT NULL,
      bosses_defeated_count INTEGER NOT NULL,
      total_glory_xp_awarded INTEGER NOT NULL,
      conferred_titles_json TEXT NOT NULL,
      adherence_percentage REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_subfactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'local_user',
      parent_faction_id TEXT NOT NULL,
      name TEXT NOT NULL,
      lore TEXT,
      motto TEXT,
      homeworld TEXT,
      doctrine_tags_json TEXT NOT NULL DEFAULT '[]',
      primary_color TEXT NOT NULL DEFAULT '#00F0FF',
      secondary_color TEXT NOT NULL DEFAULT '#1E293B',
      accent_color TEXT NOT NULL DEFAULT '#FFB800',
      icon_uri TEXT,
      icon_crop_mode TEXT NOT NULL DEFAULT 'contain',
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO character_profile (
      id, universe_id, faction_id, subfaction_id, character_name, total_xp, current_level, created_at, updated_at
    ) VALUES (
      1, 'warhammer40k', 'adeptus-astartes', 'ultramarines', 'Battle-Brother', 0, 1, datetime('now'), datetime('now')
    );

    INSERT OR IGNORE INTO warfront_settings (id, preferred_spawn_day, updated_at)
    VALUES (1, 'saturday', datetime('now'));
  `);

  // Idempotently create or repair inventory, equipment, and raid progression tables
  repairOrRecreateTable(
    db,
    'character_inventory',
    [
      { name: 'id', definition: 'TEXT PRIMARY KEY' },
      { name: 'character_id', definition: "TEXT DEFAULT 'char_main'" },
      { name: 'item_id', definition: 'TEXT' },
      { name: 'acquired_at', definition: 'TEXT' },
      { name: 'acquisition_source', definition: 'TEXT' },
      { name: 'is_equipped', definition: 'INTEGER DEFAULT 0' },
      { name: 'equipped_slot', definition: 'TEXT' },
    ],
    `CREATE TABLE IF NOT EXISTS character_inventory (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL DEFAULT 'char_main',
      item_id TEXT NOT NULL,
      acquired_at TEXT NOT NULL,
      acquisition_source TEXT NOT NULL,
      is_equipped INTEGER NOT NULL DEFAULT 0,
      equipped_slot TEXT
    );`
  );

  repairOrRecreateTable(
    db,
    'character_equipment_loadout',
    [
      { name: 'character_id', definition: "TEXT DEFAULT 'char_main'" },
      { name: 'slot', definition: 'TEXT' },
      { name: 'item_id', definition: 'TEXT' },
      { name: 'equipped_at', definition: 'TEXT' },
    ],
    `CREATE TABLE IF NOT EXISTS character_equipment_loadout (
      character_id TEXT NOT NULL DEFAULT 'char_main',
      slot TEXT NOT NULL,
      item_id TEXT,
      equipped_at TEXT NOT NULL,
      PRIMARY KEY (character_id, slot)
    );`
  );

  repairOrRecreateTable(
    db,
    'raid_loot_history',
    [
      { name: 'id', definition: 'TEXT PRIMARY KEY' },
      { name: 'raid_cycle_id', definition: 'TEXT' },
      { name: 'user_id', definition: "TEXT DEFAULT 'user_main'" },
      { name: 'character_id', definition: "TEXT DEFAULT 'char_main'" },
      { name: 'item_id', definition: 'TEXT' },
      { name: 'rewarded_at', definition: 'TEXT' },
    ],
    `CREATE TABLE IF NOT EXISTS raid_loot_history (
      id TEXT PRIMARY KEY,
      raid_cycle_id TEXT NOT NULL,
      user_id TEXT NOT NULL DEFAULT 'user_main',
      character_id TEXT NOT NULL DEFAULT 'char_main',
      item_id TEXT NOT NULL,
      rewarded_at TEXT NOT NULL
    );`
  );

  repairOrRecreateTable(
    db,
    'character_raid_progression',
    [
      { name: 'character_id', definition: "TEXT DEFAULT 'char_main'" },
      { name: 'raid_tier_id', definition: 'TEXT' },
      { name: 'victories_count', definition: 'INTEGER DEFAULT 0' },
      { name: 'first_victory_at', definition: 'TEXT' },
      { name: 'last_victory_at', definition: 'TEXT' },
    ],
    `CREATE TABLE IF NOT EXISTS character_raid_progression (
      character_id TEXT NOT NULL DEFAULT 'char_main',
      raid_tier_id TEXT NOT NULL,
      victories_count INTEGER NOT NULL DEFAULT 0,
      first_victory_at TEXT NOT NULL,
      last_victory_at TEXT NOT NULL,
      PRIMARY KEY (character_id, raid_tier_id)
    );`
  );

  repairOrRecreateTable(
    db,
    'character_raid_summary',
    [
      { name: 'character_id', definition: 'TEXT PRIMARY KEY' },
      { name: 'highest_tier_unlocked', definition: "TEXT DEFAULT 'tier_1_initiation'" },
      { name: 'total_victories', definition: 'INTEGER DEFAULT 0' },
      { name: 'last_defeated_tier', definition: 'TEXT' },
      { name: 'last_victory_at', definition: 'TEXT' },
      { name: 'updated_at', definition: 'TEXT' },
    ],
    `CREATE TABLE IF NOT EXISTS character_raid_summary (
      character_id TEXT PRIMARY KEY,
      highest_tier_unlocked TEXT NOT NULL DEFAULT 'tier_1_initiation',
      total_victories INTEGER NOT NULL DEFAULT 0,
      last_defeated_tier TEXT,
      last_victory_at TEXT,
      updated_at TEXT NOT NULL
    );`
  );

  repairOrRecreateTable(
    db,
    'character_progression_milestones',
    [
      { name: 'character_id', definition: "TEXT DEFAULT 'char_main'" },
      { name: 'milestone_type', definition: 'TEXT' },
      { name: 'milestone_key', definition: 'TEXT' },
      { name: 'achieved_at', definition: 'TEXT' },
      { name: 'metadata_json', definition: 'TEXT' },
    ],
    `CREATE TABLE IF NOT EXISTS character_progression_milestones (
      character_id TEXT NOT NULL DEFAULT 'char_main',
      milestone_type TEXT NOT NULL,
      milestone_key TEXT NOT NULL,
      achieved_at TEXT NOT NULL,
      metadata_json TEXT,
      PRIMARY KEY (character_id, milestone_type, milestone_key)
    );`
  );

  // Safely generate all essential indexes
  safeCreateIndex(db, 'CREATE INDEX IF NOT EXISTS idx_char_inv_char ON character_inventory (character_id);');
  safeCreateIndex(db, 'CREATE INDEX IF NOT EXISTS idx_char_inv_item ON character_inventory (item_id);');
  safeCreateIndex(db, 'CREATE INDEX IF NOT EXISTS idx_raid_loot_cycle ON raid_loot_history (raid_cycle_id);');
  safeCreateIndex(db, 'CREATE UNIQUE INDEX IF NOT EXISTS uq_ach_progress ON achievement_progress (achievement_id, scope, target_id);');
  safeCreateIndex(db, 'CREATE UNIQUE INDEX IF NOT EXISTS uq_ach_award ON achievement_awards (achievement_id, scope, target_id);');
  safeCreateIndex(db, 'CREATE UNIQUE INDEX IF NOT EXISTS uq_char_mission ON mission_progress (character_id, mission_id);');
  safeCreateIndex(db, 'CREATE UNIQUE INDEX IF NOT EXISTS uq_char_camp_node ON campaign_node_progress (character_id, campaign_id, node_id);');
  safeCreateIndex(db, 'CREATE INDEX IF NOT EXISTS idx_custom_subfactions_user ON custom_subfactions (user_id);');
  safeCreateIndex(db, 'CREATE INDEX IF NOT EXISTS idx_custom_subfactions_parent ON custom_subfactions (parent_faction_id);');
  safeCreateIndex(db, 'CREATE INDEX IF NOT EXISTS idx_custom_subfactions_archived ON custom_subfactions (is_archived);');

  // Ensure all columns added in later migrations exist before any indexes are generated on them
  ensureColumnExists(db, 'xp_transactions', 'user_id', "TEXT DEFAULT 'user_main'");
  ensureColumnExists(db, 'xp_transactions', 'character_id', "TEXT DEFAULT 'char_main'");
  ensureColumnExists(db, 'xp_transactions', 'requested_amount', 'INTEGER DEFAULT 0');
  ensureColumnExists(db, 'xp_transactions', 'calendar_day', 'TEXT');
  ensureColumnExists(db, 'xp_transactions', 'is_capped', 'INTEGER DEFAULT 1');
  ensureColumnExists(db, 'xp_transactions', 'reason', 'TEXT');
  ensureColumnExists(db, 'xp_transactions', 'idempotency_key', 'TEXT');

  // Safely generate indexes on xp_transactions
  try {
    db.execSync('CREATE INDEX IF NOT EXISTS idx_xp_tx_day ON xp_transactions (calendar_day);');
  } catch {}
  try {
    db.execSync('CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_tx_idempotency ON xp_transactions (idempotency_key) WHERE idempotency_key IS NOT NULL;');
  } catch {}

  // Ensure all settings columns exist
  ensureColumnExists(db, 'app_settings', 'training_preferred_days', "TEXT DEFAULT '[\"monday\",\"wednesday\",\"friday\"]'");
  ensureColumnExists(db, 'app_settings', 'training_recovery_preference', "TEXT DEFAULT 'active'");
  ensureColumnExists(db, 'app_settings', 'training_recovery_xp_enabled', 'INTEGER DEFAULT 1');
  ensureColumnExists(db, 'app_settings', 'training_recovery_xp_amount', 'INTEGER DEFAULT 50');
  ensureColumnExists(db, 'app_settings', 'notif_recovery_reminders', 'INTEGER DEFAULT 1');
  ensureColumnExists(db, 'app_settings', 'rpg_daily_xp_cap', 'INTEGER DEFAULT 500');
  ensureColumnExists(db, 'app_settings', 'unit_system', "TEXT DEFAULT 'lbs'");
  ensureColumnExists(db, 'app_settings', 'calendar_first_day', "TEXT DEFAULT 'monday'");
  ensureColumnExists(db, 'app_settings', 'date_display_format', "TEXT DEFAULT 'iso'");
  ensureColumnExists(db, 'app_settings', 'time_display_format', "TEXT DEFAULT '24h'");
  ensureColumnExists(db, 'app_settings', 'theme_accent_color', "TEXT DEFAULT 'aquila_gold'");
}

/**
 * Executes migrations sequentially to safeguard user data across app updates.
 */
export function initializeDatabase(): SQLite.SQLiteDatabase {
  const db = getDatabase();

  // Enable foreign keys and WAL mode for reliability and performance
  try {
    db.execSync('PRAGMA foreign_keys = ON;');
    db.execSync('PRAGMA journal_mode = WAL;');
  } catch {}

  // Migration tracking table
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);
  } catch {}

  // Idempotently ensure all core application tables exist.
  // This repairs any database where schema_migrations might have drifted.
  try {
    ensureAllTablesExist(db);
  } catch (err) {
    console.warn('ensureAllTablesExist warning:', err);
  }

  let appliedMigrations: number[] = [];
  try {
    appliedMigrations = db.getAllSync<{ version: number }>(
      'SELECT version FROM schema_migrations'
    ).map((row) => row.version);
  } catch {
    appliedMigrations = [];
  }

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
    `);

    // Backfill from previous victories in battle_history safely
    try {
      db.execSync(`
        INSERT OR IGNORE INTO slain_named_enemies (enemy_name, enemy_id, faction_id, slain_at, battle_id)
        SELECT enemy_name, enemy_id, enemy_faction, completed_at, id
        FROM battle_history
        WHERE outcome = 'victory' AND enemy_name IS NOT NULL AND TRIM(enemy_name) != '';
      `);
    } catch (backfillErr) {
      console.warn('Migration 11 battle_history backfill warning:', backfillErr);
    }

    // Backfill from previous victories in weekly_raids safely
    try {
      db.execSync(`
        INSERT OR IGNORE INTO slain_named_enemies (enemy_name, enemy_id, faction_id, slain_at, battle_id)
        SELECT json_extract(boss_data_json, '$.name'), cycle_id, json_extract(boss_data_json, '$.factionId'), updated_at, cycle_id
        FROM weekly_raids
        WHERE status = 'defeated' AND json_extract(boss_data_json, '$.name') IS NOT NULL;
      `);
    } catch (backfillErr) {
      console.warn('Migration 11 weekly_raids backfill warning:', backfillErr);
    }

    db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (11, datetime('now'));");
  }

  // Migration 12: Campaign Academy 90-Day Campaigns, Quests, Phase Reports & Final Dossiers
  if (!appliedMigrations.includes(12)) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS campaign_academy_enrollments (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL DEFAULT 'char_main',
        campaign_id TEXT NOT NULL,
        campaign_title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        current_phase_number INTEGER NOT NULL DEFAULT 1,
        current_chapter_number INTEGER NOT NULL DEFAULT 1,
        active_program_enrollment_id TEXT NOT NULL,
        started_at TEXT NOT NULL,
        paused_at TEXT,
        resumed_at TEXT,
        completed_at TEXT,
        completed_chapter_ids_json TEXT NOT NULL DEFAULT '[]',
        completed_quest_ids_json TEXT NOT NULL DEFAULT '[]',
        unlocked_boss_chapter_ids_json TEXT NOT NULL DEFAULT '[]',
        defeated_boss_chapter_ids_json TEXT NOT NULL DEFAULT '[]',
        phase1_report_claimed INTEGER NOT NULL DEFAULT 0,
        phase2_report_claimed INTEGER NOT NULL DEFAULT 0,
        phase3_report_claimed INTEGER NOT NULL DEFAULT 0,
        final_dossier_claimed INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS campaign_phase_reports (
        id TEXT PRIMARY KEY,
        enrollment_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        phase_number INTEGER NOT NULL,
        phase_title TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        sessions_completed INTEGER NOT NULL,
        total_volume_kg REAL NOT NULL,
        total_working_sets INTEGER NOT NULL,
        boss_defeated_name TEXT NOT NULL,
        xp_earned INTEGER NOT NULL,
        summary_notes_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (enrollment_id) REFERENCES campaign_academy_enrollments (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS campaign_final_dossiers (
        id TEXT PRIMARY KEY,
        enrollment_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        campaign_title TEXT NOT NULL,
        experience_level TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        total_sessions_completed INTEGER NOT NULL,
        total_planned_sessions INTEGER NOT NULL,
        total_volume_kg REAL NOT NULL,
        total_working_sets INTEGER NOT NULL,
        chapters_completed_count INTEGER NOT NULL,
        quests_completed_count INTEGER NOT NULL,
        bosses_defeated_count INTEGER NOT NULL,
        total_glory_xp_awarded INTEGER NOT NULL,
        conferred_titles_json TEXT NOT NULL,
        adherence_percentage REAL NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (enrollment_id) REFERENCES campaign_academy_enrollments (id) ON DELETE CASCADE
      );
    `);

    db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (12, datetime('now'));");
  }

  // Migration 13: Custom Subfaction Creator & Uploaded Icons
  if (!appliedMigrations.includes(13)) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS custom_subfactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'local_user',
        parent_faction_id TEXT NOT NULL,
        name TEXT NOT NULL,
        lore TEXT,
        motto TEXT,
        homeworld TEXT,
        doctrine_tags_json TEXT NOT NULL DEFAULT '[]',
        primary_color TEXT NOT NULL DEFAULT '#00F0FF',
        secondary_color TEXT NOT NULL DEFAULT '#1E293B',
        accent_color TEXT NOT NULL DEFAULT '#FFB800',
        icon_uri TEXT,
        icon_crop_mode TEXT NOT NULL DEFAULT 'contain',
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_custom_subfactions_user ON custom_subfactions (user_id);
      CREATE INDEX IF NOT EXISTS idx_custom_subfactions_parent ON custom_subfactions (parent_faction_id);
      CREATE INDEX IF NOT EXISTS idx_custom_subfactions_archived ON custom_subfactions (is_archived);
    `);

    db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (13, datetime('now'));");
  }

  // Migration 14: Centralized XP Transactions, Daily Cap Accounting & Idempotency
  if (!appliedMigrations.includes(14)) {
    try {
      db.execSync("ALTER TABLE xp_transactions ADD COLUMN user_id TEXT DEFAULT 'user_main';");
    } catch {}
    try {
      db.execSync("ALTER TABLE xp_transactions ADD COLUMN character_id TEXT DEFAULT 'char_main';");
    } catch {}
    try {
      db.execSync("ALTER TABLE xp_transactions ADD COLUMN requested_amount INTEGER DEFAULT 0;");
    } catch {}
    try {
      db.execSync("ALTER TABLE xp_transactions ADD COLUMN calendar_day TEXT;");
    } catch {}
    try {
      db.execSync("ALTER TABLE xp_transactions ADD COLUMN is_capped INTEGER DEFAULT 0;");
    } catch {}
    try {
      db.execSync("ALTER TABLE xp_transactions ADD COLUMN reason TEXT;");
    } catch {}
    try {
      db.execSync("ALTER TABLE xp_transactions ADD COLUMN idempotency_key TEXT;");
    } catch {}
    try {
      db.execSync("CREATE INDEX IF NOT EXISTS idx_xp_tx_day ON xp_transactions (calendar_day);");
    } catch {}
    try {
      db.execSync("CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_tx_idempotency ON xp_transactions (idempotency_key) WHERE idempotency_key IS NOT NULL;");
    } catch {}

    // Backfill legacy transactions safely
    try {
      db.execSync(`
        UPDATE xp_transactions 
        SET calendar_day = substr(created_at, 1, 10),
            requested_amount = amount,
            is_capped = 0
        WHERE calendar_day IS NULL;
      `);
    } catch {}

    db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (14, datetime('now'));");
  }

  // Migration 15: Character Inventory, Loadout & Raid Loot History
  if (!appliedMigrations.includes(15)) {
    try {
      repairOrRecreateTable(
        db,
        'character_inventory',
        [
          { name: 'id', definition: 'TEXT PRIMARY KEY' },
          { name: 'character_id', definition: "TEXT DEFAULT 'char_main'" },
          { name: 'item_id', definition: 'TEXT' },
          { name: 'acquired_at', definition: 'TEXT' },
          { name: 'acquisition_source', definition: 'TEXT' },
          { name: 'is_equipped', definition: 'INTEGER DEFAULT 0' },
          { name: 'equipped_slot', definition: 'TEXT' },
        ],
        `CREATE TABLE IF NOT EXISTS character_inventory (
          id TEXT PRIMARY KEY,
          character_id TEXT NOT NULL DEFAULT 'char_main',
          item_id TEXT NOT NULL,
          acquired_at TEXT NOT NULL,
          acquisition_source TEXT NOT NULL,
          is_equipped INTEGER NOT NULL DEFAULT 0,
          equipped_slot TEXT
        );`
      );

      safeCreateIndex(db, 'CREATE INDEX IF NOT EXISTS idx_char_inv_char ON character_inventory (character_id);');
      safeCreateIndex(db, 'CREATE INDEX IF NOT EXISTS idx_char_inv_item ON character_inventory (item_id);');

      repairOrRecreateTable(
        db,
        'character_equipment_loadout',
        [
          { name: 'character_id', definition: "TEXT DEFAULT 'char_main'" },
          { name: 'slot', definition: 'TEXT' },
          { name: 'item_id', definition: 'TEXT' },
          { name: 'equipped_at', definition: 'TEXT' },
        ],
        `CREATE TABLE IF NOT EXISTS character_equipment_loadout (
          character_id TEXT NOT NULL DEFAULT 'char_main',
          slot TEXT NOT NULL,
          item_id TEXT,
          equipped_at TEXT NOT NULL,
          PRIMARY KEY (character_id, slot)
        );`
      );

      repairOrRecreateTable(
        db,
        'raid_loot_history',
        [
          { name: 'id', definition: 'TEXT PRIMARY KEY' },
          { name: 'raid_cycle_id', definition: 'TEXT' },
          { name: 'user_id', definition: "TEXT DEFAULT 'user_main'" },
          { name: 'character_id', definition: "TEXT DEFAULT 'char_main'" },
          { name: 'item_id', definition: 'TEXT' },
          { name: 'rewarded_at', definition: 'TEXT' },
        ],
        `CREATE TABLE IF NOT EXISTS raid_loot_history (
          id TEXT PRIMARY KEY,
          raid_cycle_id TEXT NOT NULL,
          user_id TEXT NOT NULL DEFAULT 'user_main',
          character_id TEXT NOT NULL DEFAULT 'char_main',
          item_id TEXT NOT NULL,
          rewarded_at TEXT NOT NULL
        );`
      );

      safeCreateIndex(db, 'CREATE INDEX IF NOT EXISTS idx_raid_loot_cycle ON raid_loot_history (raid_cycle_id);');

      db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (15, datetime('now'));");
    } catch (mig15Err) {
      console.warn('Migration 15 non-fatal warning:', mig15Err);
    }
  }

  // Migration 16: MMORPG Raid Progression, Tier Ladders & Milestones
  if (!appliedMigrations.includes(16)) {
    try {
      repairOrRecreateTable(
        db,
        'character_raid_progression',
        [
          { name: 'character_id', definition: "TEXT DEFAULT 'char_main'" },
          { name: 'raid_tier_id', definition: 'TEXT' },
          { name: 'victories_count', definition: 'INTEGER DEFAULT 0' },
          { name: 'first_victory_at', definition: 'TEXT' },
          { name: 'last_victory_at', definition: 'TEXT' },
        ],
        `CREATE TABLE IF NOT EXISTS character_raid_progression (
          character_id TEXT NOT NULL DEFAULT 'char_main',
          raid_tier_id TEXT NOT NULL,
          victories_count INTEGER NOT NULL DEFAULT 0,
          first_victory_at TEXT NOT NULL,
          last_victory_at TEXT NOT NULL,
          PRIMARY KEY (character_id, raid_tier_id)
        );`
      );

      repairOrRecreateTable(
        db,
        'character_raid_summary',
        [
          { name: 'character_id', definition: 'TEXT PRIMARY KEY' },
          { name: 'highest_tier_unlocked', definition: "TEXT DEFAULT 'tier_1_initiation'" },
          { name: 'total_victories', definition: 'INTEGER DEFAULT 0' },
          { name: 'last_defeated_tier', definition: 'TEXT' },
          { name: 'last_victory_at', definition: 'TEXT' },
          { name: 'updated_at', definition: 'TEXT' },
        ],
        `CREATE TABLE IF NOT EXISTS character_raid_summary (
          character_id TEXT PRIMARY KEY,
          highest_tier_unlocked TEXT NOT NULL DEFAULT 'tier_1_initiation',
          total_victories INTEGER NOT NULL DEFAULT 0,
          last_defeated_tier TEXT,
          last_victory_at TEXT,
          updated_at TEXT NOT NULL
        );`
      );

      repairOrRecreateTable(
        db,
        'character_progression_milestones',
        [
          { name: 'character_id', definition: "TEXT DEFAULT 'char_main'" },
          { name: 'milestone_type', definition: 'TEXT' },
          { name: 'milestone_key', definition: 'TEXT' },
          { name: 'achieved_at', definition: 'TEXT' },
          { name: 'metadata_json', definition: 'TEXT' },
        ],
        `CREATE TABLE IF NOT EXISTS character_progression_milestones (
          character_id TEXT NOT NULL DEFAULT 'char_main',
          milestone_type TEXT NOT NULL,
          milestone_key TEXT NOT NULL,
          achieved_at TEXT NOT NULL,
          metadata_json TEXT,
          PRIMARY KEY (character_id, milestone_type, milestone_key)
        );`
      );

      db.execSync("INSERT INTO schema_migrations (version, applied_at) VALUES (16, datetime('now'));");
    } catch (mig16Err) {
      console.warn('Migration 16 non-fatal warning:', mig16Err);
    }
  }

  return db;
}



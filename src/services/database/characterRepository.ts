import { getDatabase } from './db';
import { CharacterProfile, UserStats } from '../../types/character';
import { getLevelFromTotalXp } from '../progression/rankEngine';

export function getCharacterProfile(): CharacterProfile {
  const db = getDatabase();
  const row = db.getFirstSync<{
    id: number;
    universe_id: string;
    faction_id: string;
    subfaction_id: string | null;
    character_name: string;
    total_xp: number;
    current_level: number;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM character_profile WHERE id = 1');

  if (!row) {
    // Fallback if not initialized
    const now = new Date().toISOString();
    db.runSync(`
      INSERT OR REPLACE INTO character_profile (
        id, universe_id, faction_id, subfaction_id, character_name, total_xp, current_level, created_at, updated_at
      ) VALUES (1, 'warhammer40k', 'adeptus-astartes', 'ultramarines', 'Battle-Brother', 0, 1, ?, ?)
    `, [now, now]);

    return {
      id: 1,
      universeId: 'warhammer40k',
      factionId: 'adeptus-astartes',
      subfactionId: 'ultramarines',
      characterName: 'Battle-Brother',
      totalXp: 0,
      currentLevel: 1,
      createdAt: now,
      updatedAt: now,
    };
  }

  return {
    id: row.id,
    universeId: row.universe_id,
    factionId: row.faction_id,
    subfactionId: row.subfaction_id || undefined,
    characterName: row.character_name,
    totalXp: row.total_xp,
    currentLevel: row.current_level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function updateFactionAllegiance(factionId: string, subfactionId?: string): CharacterProfile {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE character_profile 
     SET faction_id = ?, subfaction_id = ?, updated_at = ? 
     WHERE id = 1`,
    [factionId, subfactionId || null, now]
  );
  return getCharacterProfile();
}

/**
 * Syncs the local character profile name, faction, and subfaction from cloud account.
 */
export function syncCharacterProfileFromCloud(profile: {
  displayName?: string;
  factionId?: string;
  subfactionId?: string;
}): CharacterProfile {
  const db = getDatabase();
  const current = getCharacterProfile();
  const newName = profile.displayName || current.characterName;
  const newFaction = profile.factionId || current.factionId;
  const newSubfaction =
    profile.subfactionId !== undefined ? profile.subfactionId : current.subfactionId;
  const now = new Date().toISOString();

  db.runSync(
    `UPDATE character_profile 
     SET character_name = ?, faction_id = ?, subfaction_id = ?, updated_at = ? 
     WHERE id = 1`,
    [newName, newFaction, newSubfaction || null, now]
  );
  return getCharacterProfile();
}

export function addCharacterXp(xpGained: number): CharacterProfile {
  const db = getDatabase();
  const current = getCharacterProfile();
  const newTotalXp = Math.max(0, current.totalXp + xpGained);
  const newLevel = getLevelFromTotalXp(newTotalXp);
  const now = new Date().toISOString();

  db.runSync(
    `UPDATE character_profile 
     SET total_xp = ?, current_level = ?, updated_at = ? 
     WHERE id = 1`,
    [newTotalXp, newLevel, now]
  );

  return getCharacterProfile();
}

export function syncTotalXpFromHistory(): CharacterProfile {
  const db = getDatabase();
  const row = db.getFirstSync<{ total: number | null }>(
    'SELECT SUM(total_xp_earned) as total FROM workout_sessions WHERE is_completed = 1'
  );
  const calculatedTotalXp = row?.total || 0;
  const newLevel = getLevelFromTotalXp(calculatedTotalXp);
  const now = new Date().toISOString();

  db.runSync(
    `UPDATE character_profile 
     SET total_xp = ?, current_level = ?, updated_at = ? 
     WHERE id = 1`,
    [calculatedTotalXp, newLevel, now]
  );

  return getCharacterProfile();
}

export function getUserCareerStats(): UserStats {
  const db = getDatabase();

  const sessionRow = db.getFirstSync<{ count: number; total_xp: number | null }>(
    'SELECT COUNT(*) as count, SUM(total_xp_earned) as total_xp FROM workout_sessions WHERE is_completed = 1'
  );

  const setRow = db.getFirstSync<{ count: number; total_reps: number | null }>(
    `SELECT COUNT(s.id) as count, SUM(s.reps) as total_reps 
     FROM workout_sets s 
     JOIN workout_exercises e ON s.exercise_id = e.id 
     JOIN workout_sessions w ON e.session_id = w.id 
     WHERE s.is_completed = 1 AND w.is_completed = 1`
  );

  // Volume in kg
  const sets = db.getAllSync<{ reps: number; weight: number; unit: string }>(
    `SELECT s.reps, s.weight, s.unit 
     FROM workout_sets s 
     JOIN workout_exercises e ON s.exercise_id = e.id 
     JOIN workout_sessions w ON e.session_id = w.id 
     WHERE s.is_completed = 1 AND w.is_completed = 1`
  );

  let totalVolumeKg = 0;
  for (const s of sets) {
    const weightInKg = s.unit === 'kg' ? s.weight : s.weight * 0.45359237;
    totalVolumeKg += Math.round(s.reps * weightInKg);
  }

  return {
    totalWorkouts: sessionRow?.count || 0,
    totalSets: setRow?.count || 0,
    totalReps: setRow?.total_reps || 0,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalXpEarned: sessionRow?.total_xp || 0,
  };
}

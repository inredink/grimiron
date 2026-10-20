import { getDatabase } from './db';
import {
  CustomSubfactionRecord,
  CustomSubfactionInput,
  DoctrineTag,
} from '../../types/customSubfaction';
import { deleteCustomIconFile } from '../../utils/customIconStorage';
import {
  validateCustomSubfaction,
  MAX_SUBFACTION_NAME_LENGTH,
  ValidationError,
} from '../../utils/customSubfactionValidator';

export { MAX_SUBFACTION_NAME_LENGTH, ValidationError };

export function validateSubfactionInput(
  input: CustomSubfactionInput,
  existingId?: string,
  userId: string = 'local_user'
): { isValid: boolean; errors: ValidationError[]; sanitizedName: string } {
  const result = validateCustomSubfaction(input, existingId);
  if (!result.isValid) {
    return result;
  }

  // Duplicate name check within SQLite database
  try {
    const db = getDatabase();
    const existing = db.getFirstSync<{ id: string }>(
      `SELECT id FROM custom_subfactions 
       WHERE user_id = ? AND LOWER(TRIM(name)) = LOWER(?) AND is_archived = 0 ${existingId ? 'AND id != ?' : ''}`,
      existingId ? [userId, result.sanitizedName, existingId] : [userId, result.sanitizedName]
    );
    if (existing) {
      return {
        isValid: false,
        errors: [
          {
            field: 'name',
            message: `You already have an active subfaction named "${result.sanitizedName}". Choose a distinct name.`,
          },
        ],
        sanitizedName: result.sanitizedName,
      };
    }
  } catch {
    // If DB not yet ready or in testing, skip duplicate SQL check
  }

  return result;
}

interface CustomSubfactionRow {
  id: string;
  user_id: string;
  parent_faction_id: string;
  name: string;
  lore: string | null;
  motto: string | null;
  homeworld: string | null;
  doctrine_tags_json: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  icon_uri: string | null;
  icon_crop_mode: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

function mapRowToRecord(row: CustomSubfactionRow): CustomSubfactionRecord {
  let doctrineTags: DoctrineTag[] = [];
  try {
    doctrineTags = JSON.parse(row.doctrine_tags_json || '[]');
  } catch {
    doctrineTags = [];
  }

  return {
    id: row.id,
    userId: row.user_id,
    parentFactionId: row.parent_faction_id,
    name: row.name,
    lore: row.lore || undefined,
    motto: row.motto || undefined,
    homeworld: row.homeworld || undefined,
    doctrineTags,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    accentColor: row.accent_color,
    iconUri: row.icon_uri || undefined,
    iconCropMode: (row.icon_crop_mode === 'cover' ? 'cover' : 'contain'),
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Creates and persists a new custom subfaction in SQLite.
 */
export function createCustomSubfaction(
  input: CustomSubfactionInput,
  userId: string = 'local_user'
): CustomSubfactionRecord {
  const validation = validateSubfactionInput(input, undefined, userId);
  if (!validation.isValid) {
    throw new Error(validation.errors.map((e) => e.message).join(' '));
  }

  const db = getDatabase();
  const id = `subfac_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const primaryColor = input.primaryColor || '#00F0FF';
  const secondaryColor = input.secondaryColor || '#1E293B';
  const accentColor = input.accentColor || '#FFB800';
  const doctrineTagsJson = JSON.stringify(input.doctrineTags || []);
  const iconCropMode = input.iconCropMode || 'contain';

  db.runSync(
    `INSERT INTO custom_subfactions (
      id, user_id, parent_faction_id, name, lore, motto, homeworld,
      doctrine_tags_json, primary_color, secondary_color, accent_color,
      icon_uri, icon_crop_mode, is_archived, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      id,
      userId,
      input.parentFactionId.trim(),
      validation.sanitizedName,
      input.lore?.trim() || null,
      input.motto?.trim() || null,
      input.homeworld?.trim() || null,
      doctrineTagsJson,
      primaryColor,
      secondaryColor,
      accentColor,
      input.iconUri || null,
      iconCropMode,
      now,
      now,
    ]
  );

  const created = getCustomSubfactionById(id);
  if (!created) {
    throw new Error('Failed to retrieve newly created custom subfaction.');
  }
  return created;
}

/**
 * Retrieves a custom subfaction by ID.
 */
export function getCustomSubfactionById(id: string): CustomSubfactionRecord | null {
  const db = getDatabase();
  const row = db.getFirstSync<CustomSubfactionRow>(
    'SELECT * FROM custom_subfactions WHERE id = ?',
    [id]
  );
  return row ? mapRowToRecord(row) : null;
}

/**
 * Retrieves all custom subfactions for a user, optionally filtering out archived ones.
 */
export function getAllCustomSubfactions(
  userId: string = 'local_user',
  includeArchived: boolean = false
): CustomSubfactionRecord[] {
  const db = getDatabase();
  const query = includeArchived
    ? 'SELECT * FROM custom_subfactions WHERE user_id = ? ORDER BY created_at DESC'
    : 'SELECT * FROM custom_subfactions WHERE user_id = ? AND is_archived = 0 ORDER BY created_at DESC';

  const rows = db.getAllSync<CustomSubfactionRow>(query, [userId]);
  return rows.map(mapRowToRecord);
}

/**
 * Retrieves custom subfactions belonging to a specific parent faction.
 */
export function getCustomSubfactionsByParent(
  parentFactionId: string,
  userId: string = 'local_user'
): CustomSubfactionRecord[] {
  const db = getDatabase();
  const rows = db.getAllSync<CustomSubfactionRow>(
    'SELECT * FROM custom_subfactions WHERE user_id = ? AND parent_faction_id = ? AND is_archived = 0 ORDER BY name ASC',
    [userId, parentFactionId]
  );
  return rows.map(mapRowToRecord);
}

/**
 * Updates an existing custom subfaction.
 */
export function updateCustomSubfaction(
  id: string,
  updates: Partial<CustomSubfactionInput>,
  userId: string = 'local_user'
): CustomSubfactionRecord {
  const current = getCustomSubfactionById(id);
  if (!current) {
    throw new Error(`Custom subfaction with id "${id}" not found.`);
  }

  // If name is updated, validate it
  let sanitizedName = current.name;
  if (updates.name !== undefined) {
    const validation = validateSubfactionInput(
      {
        name: updates.name,
        parentFactionId: updates.parentFactionId || current.parentFactionId,
      },
      id,
      userId
    );
    if (!validation.isValid) {
      throw new Error(validation.errors.map((e) => e.message).join(' '));
    }
    sanitizedName = validation.sanitizedName;
  }

  const db = getDatabase();
  const now = new Date().toISOString();

  const parentFactionId = updates.parentFactionId !== undefined ? updates.parentFactionId : current.parentFactionId;
  const lore = updates.lore !== undefined ? (updates.lore ? updates.lore.trim() : null) : (current.lore || null);
  const motto = updates.motto !== undefined ? (updates.motto ? updates.motto.trim() : null) : (current.motto || null);
  const homeworld = updates.homeworld !== undefined ? (updates.homeworld ? updates.homeworld.trim() : null) : (current.homeworld || null);
  const doctrineTagsJson =
    updates.doctrineTags !== undefined
      ? JSON.stringify(updates.doctrineTags)
      : JSON.stringify(current.doctrineTags);
  const primaryColor = updates.primaryColor !== undefined ? updates.primaryColor : current.primaryColor;
  const secondaryColor = updates.secondaryColor !== undefined ? updates.secondaryColor : current.secondaryColor;
  const accentColor = updates.accentColor !== undefined ? updates.accentColor : current.accentColor;
  const iconUri = updates.iconUri !== undefined ? updates.iconUri || null : (current.iconUri || null);
  const iconCropMode = updates.iconCropMode !== undefined ? updates.iconCropMode : current.iconCropMode;

  // If icon was changed and old icon was present and different, schedule old icon cleanup
  if (updates.iconUri !== undefined && current.iconUri && current.iconUri !== updates.iconUri) {
    deleteCustomIconFile(current.iconUri);
  }

  db.runSync(
    `UPDATE custom_subfactions SET
      parent_faction_id = ?,
      name = ?,
      lore = ?,
      motto = ?,
      homeworld = ?,
      doctrine_tags_json = ?,
      primary_color = ?,
      secondary_color = ?,
      accent_color = ?,
      icon_uri = ?,
      icon_crop_mode = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      parentFactionId,
      sanitizedName,
      lore,
      motto,
      homeworld,
      doctrineTagsJson,
      primaryColor,
      secondaryColor,
      accentColor,
      iconUri,
      iconCropMode,
      now,
      id,
    ]
  );

  const updated = getCustomSubfactionById(id);
  if (!updated) {
    throw new Error('Failed to retrieve updated custom subfaction.');
  }
  return updated;
}

/**
 * Duplicates a custom subfaction as the starting point for another.
 */
export function duplicateCustomSubfaction(
  sourceId: string,
  customName?: string,
  userId: string = 'local_user'
): CustomSubfactionRecord {
  const source = getCustomSubfactionById(sourceId);
  if (!source) {
    throw new Error(`Source subfaction "${sourceId}" not found for duplication.`);
  }

  const newName = (customName || `${source.name} (Copy)`).trim();

  return createCustomSubfaction(
    {
      name: newName,
      parentFactionId: source.parentFactionId,
      lore: source.lore,
      motto: source.motto,
      homeworld: source.homeworld,
      doctrineTags: [...source.doctrineTags],
      primaryColor: source.primaryColor,
      secondaryColor: source.secondaryColor,
      accentColor: source.accentColor,
      iconUri: source.iconUri, // Reference existing icon safely without duplicating file
      iconCropMode: source.iconCropMode,
    },
    userId
  );
}

/**
 * Archives a custom subfaction without deleting it.
 * Preserves completed workouts, battle history snapshots, and achievements intact.
 */
export function archiveCustomSubfaction(id: string): boolean {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE custom_subfactions SET is_archived = 1, updated_at = ? WHERE id = ?`,
    [now, id]
  );
  return true;
}

/**
 * Restores an archived custom subfaction.
 */
export function restoreCustomSubfaction(id: string): boolean {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE custom_subfactions SET is_archived = 0, updated_at = ? WHERE id = ?`,
    [now, id]
  );
  return true;
}

/**
 * Deletes a custom subfaction permanently.
 * Cleans up the stored icon file if it exists and is not used by any duplicate.
 */
export function deleteCustomSubfaction(id: string): boolean {
  const target = getCustomSubfactionById(id);
  if (!target) return false;

  const db = getDatabase();

  // Check if icon is shared with any duplicate
  if (target.iconUri) {
    const otherUsage = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM custom_subfactions WHERE icon_uri = ? AND id != ?',
      [target.iconUri, id]
    );
    if (!otherUsage || otherUsage.count === 0) {
      deleteCustomIconFile(target.iconUri);
    }
  }

  db.runSync('DELETE FROM custom_subfactions WHERE id = ?', [id]);
  return true;
}

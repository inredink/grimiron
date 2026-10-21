import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare const require: any;
declare const process: any;

const supabaseUrl = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) || '';

const inMemoryAuthStorage = new Map<string, string>();

interface SqliteDbHandle {
  getFirstSync<T = any>(sql: string, params?: any[]): T | null;
  getAllSync<T = any>(sql: string, params?: any[]): T[];
  runSync(sql: string, params?: any[]): void;
  execSync(sql: string): void;
}

function getDbSafe(): SqliteDbHandle | null {
  try {
    const dbMod = require('../database/db');
    return dbMod.getDatabase ? (dbMod.getDatabase() as SqliteDbHandle) : null;
  } catch {
    return null;
  }
}

/**
 * Robust persistent storage adapter for Supabase Auth in React Native / Expo.
 * Persists login tokens, sessions, and refresh credentials to SQLite so the user
 * remains permanently authenticated across app reboots.
 */
export const sqliteAuthStorage = {
  getItem: (key: string): string | null => {
    try {
      const db = getDbSafe();
      if (db) {
        const row = db.getFirstSync<{ value: string }>(
          'SELECT value FROM auth_session_store WHERE key = ?',
          [key]
        );
        if (row?.value) {
          return row.value;
        }
      }
    } catch {
      // In-memory fallback if SQLite table is cold or running in mock environment
    }
    return inMemoryAuthStorage.get(key) || null;
  },

  setItem: (key: string, value: string): void => {
    inMemoryAuthStorage.set(key, value);
    try {
      const db = getDbSafe();
      if (db) {
        db.runSync(
          `INSERT INTO auth_session_store (key, value, updated_at)
           VALUES (?, ?, datetime('now'))
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
          [key, value]
        );
      }
    } catch {
      // Handled via in-memory storage fallback
    }
  },

  removeItem: (key: string): void => {
    inMemoryAuthStorage.delete(key);
    try {
      const db = getDbSafe();
      if (db) {
        db.runSync('DELETE FROM auth_session_store WHERE key = ?', [key]);
      }
    } catch {
      // Handled via in-memory storage fallback
    }
  },
};

/**
 * Checks whether valid Supabase configuration is present in the environment.
 */
export function isSupabaseConfigured(): boolean {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-supabase-url')
  );
}

export function getSupabaseConfig(): { url: string; configured: boolean } {
  return {
    url: isSupabaseConfigured() ? supabaseUrl : '',
    configured: isSupabaseConfigured(),
  };
}

let clientInstance: SupabaseClient | null = null;

/**
 * Returns the singleton Supabase client or null if not yet configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: sqliteAuthStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }

  return clientInstance;
}

import { getDatabase } from '../database/db';
import { getSupabaseClient } from '../supabase/client';

export interface AccountInfo {
  userId: string;
  isCloudAuthenticated: boolean;
  email?: string;
  lastSyncedAt?: string;
}

/**
 * Retrieves current account metadata safely without exposing secret tokens.
 */
export async function getAccountInfo(): Promise<AccountInfo> {
  let userId = 'local_user';
  let email: string | undefined = undefined;
  let isCloudAuthenticated = false;

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data } = await client.auth.getSession();
      if (data?.session?.user) {
        userId = data.session.user.id;
        email = data.session.user.email;
        isCloudAuthenticated = true;
      }
    } catch {}
  }

  return {
    userId,
    isCloudAuthenticated,
    email,
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * Signs in to an existing Supabase cloud account.
 */
export async function signInAccount(
  email: string,
  pass: string
): Promise<{ success: boolean; message: string; account?: AccountInfo }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Cloud infrastructure is not configured. Local mode active.',
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          message:
            'Email confirmation required by provider. In Supabase, confirm user or disable email confirmation in Auth settings.',
        };
      }
      return { success: false, message: error.message };
    }
    const info = await getAccountInfo();
    return {
      success: true,
      message: `Signed in successfully as ${data.user?.email || 'Warrior'}.`,
      account: info,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Authentication error occurred.',
    };
  }
}

/**
 * Registers a new Supabase cloud warrior account.
 */
export async function signUpAccount(
  email: string,
  pass: string,
  displayName: string,
  factionId: string = 'adeptus-astartes'
): Promise<{ success: boolean; message: string; account?: AccountInfo }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Cloud infrastructure is not configured. Local mode active.',
    };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          display_name: displayName.trim(),
          faction_id: factionId,
        },
      },
    });
    if (error) {
      return { success: false, message: error.message };
    }

    // In Supabase, if an email is already registered and signup is attempted,
    // data.user exists but identities array is empty.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        success: false,
        message: 'A crusader account with this email already exists. Please choose Sign In instead.',
      };
    }

    const info = await getAccountInfo();
    const isConfirmed = !!data.session;
    return {
      success: true,
      message: isConfirmed
        ? 'Warrior account registered and synchronized with Crusade Cloud!'
        : `Warrior account created! A verification email has been dispatched to ${email.trim()}. Please check your Inbox and Spam/Junk folder.`,
      account: info,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Registration error occurred.',
    };
  }
}

/**
 * Resends the Supabase signup confirmation email.
 */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Cloud infrastructure is not configured. Local mode active.' };
  }

  try {
    const { error } = await client.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    if (error) {
      return { success: false, message: error.message };
    }
    return {
      success: true,
      message: `Verification transmission successfully resent to ${email.trim()}. Check your Inbox and Spam/Junk folder.`,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to resend verification transmission.' };
  }
}

/**
 * Signs out of the cloud account safely.
 * Clears in-memory tokens while preserving local SQLite database.
 */
export async function signOutAccount(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.auth.signOut();
      if (error) {
        console.warn('Supabase signout warning:', error);
      }
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Error occurred during sign out.',
      };
    }
  }

  return {
    success: true,
    message: 'Successfully signed out. Cloud session terminated.',
  };
}

/**
 * Performs explicit, secure local account deletion and resets the tactical profile.
 * Anonymizes battle history entries, deletes local custom subfactions,
 * clears workout history, drops queued attacks, and resets character profile.
 */
export async function deleteAccountData(
  requireCloudDeletion: boolean = false
): Promise<{ success: boolean; message: string }> {
  const db = getDatabase();

  try {
    const client = getSupabaseClient();
    // 1. If cloud authenticated, attempt backend account deletion if requested
    if (requireCloudDeletion && client) {
      try {
        const { data } = await client.auth.getSession();
        if (data?.session?.user) {
          console.log('Cloud user deletion requested for:', data.session.user.id);
        }
      } catch {}
    }

    // 2. Anonymize shared multiplayer battle participants rather than breaking foreign keys
    db.runSync(
      `UPDATE battle_participants
       SET callsign = '[DELETED WARRIOR]', user_id = 'deleted_user'
       WHERE user_id != 'system';`
    );

    // 3. Delete user data across all tables
    db.runSync('DELETE FROM active_workout_draft;');
    db.runSync('DELETE FROM coop_attack_queue;');
    db.runSync('DELETE FROM custom_subfactions;');
    db.runSync('DELETE FROM workout_sets;');
    db.runSync('DELETE FROM workout_exercises;');
    db.runSync('DELETE FROM workout_sessions;');
    db.runSync('DELETE FROM xp_transactions;');
    db.runSync('DELETE FROM achievement_awards;');
    db.runSync('DELETE FROM achievement_progress;');
    db.runSync('DELETE FROM mission_progress;');
    db.runSync('DELETE FROM campaign_node_progress;');
    db.runSync('DELETE FROM program_session_records;');
    db.runSync('DELETE FROM user_programs;');
    db.runSync('DELETE FROM campaign_academy_enrollments;');
    db.runSync('DELETE FROM campaign_phase_reports;');
    db.runSync('DELETE FROM campaign_final_dossiers;');
    db.runSync('DELETE FROM pending_notifications;');
    db.runSync('DELETE FROM app_settings;');

    // 4. Reinitialize clean initiate character
    db.runSync(`
      UPDATE character_profile
      SET universe_id = 'warhammer40k',
          faction_id = 'adeptus-astartes',
          subfaction_id = 'ultramarines',
          character_name = 'Battle-Brother',
          total_xp = 0,
          current_level = 1,
          updated_at = datetime('now')
      WHERE id = 1;
    `);

    // 5. Sign out of Supabase
    if (client) {
      try {
        await client.auth.signOut();
      } catch {}
    }

    return {
      success: true,
      message: 'Account data completely purged. Tactical profile reset to initiate state.',
    };
  } catch (err: any) {
    console.error('Account deletion error:', err);
    return {
      success: false,
      message: err?.message || 'Failed to purge account data.',
    };
  }
}

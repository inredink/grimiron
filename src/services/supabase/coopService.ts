import { getSupabaseClient, isSupabaseConfigured } from './client';
import {
  ActiveCoopRaid,
  CoopAttack,
  CoopAttackPayload,
  CoopAttackResult,
  CoopBoss,
  CoopGroup,
  CoopGroupMember,
  CoopProfile,
} from '../../types/coop';
import {
  enqueueCoopAttack,
  getUnsyncedAttacks,
  markAttackFailed,
  markAttackSynced,
  updateActiveRaidHp,
} from '../database/coopQueueRepository';
import { sanitizeCoopAttackPayload } from '../combat/coopAttackSanitizer';

export { sanitizeCoopAttackPayload };

export const coopService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  async getCurrentUser() {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data: { user } } = await client.auth.getUser();
    return user;
  },

  async signUp(email: string, password: string, displayName: string, factionId: string = 'adeptus-astartes') {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          faction_id: factionId,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const client = getSupabaseClient();
    if (!client) return;
    await client.auth.signOut();
  },

  async getMyProfile(): Promise<CoopProfile | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    const user = (await client.auth.getUser()).data.user;
    if (!user) return null;

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      displayName: data.display_name,
      factionId: data.faction_id,
      avatarGlyph: data.avatar_glyph,
      createdAt: data.created_at,
    };
  },

  async updateMyProfile(updates: {
    displayName?: string;
    factionId?: string;
    avatarGlyph?: string;
  }): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    const user = (await client.auth.getUser()).data.user;
    if (!user) return false;

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.displayName !== undefined) payload.display_name = updates.displayName.trim();
    if (updates.factionId !== undefined) payload.faction_id = updates.factionId;
    if (updates.avatarGlyph !== undefined) payload.avatar_glyph = updates.avatarGlyph;

    const { error } = await client
      .from('profiles')
      .update(payload)
      .eq('id', user.id);

    if (error) {
      console.warn('coopService.updateMyProfile error:', error.message);
      return false;
    }
    return true;
  },

  async updateMyProfileFaction(factionId: string): Promise<boolean> {
    return this.updateMyProfile({ factionId });
  },

  async updateMyProfileDisplayName(displayName: string): Promise<boolean> {
    return this.updateMyProfile({ displayName });
  },

  async getOnboardingMetadata(): Promise<boolean | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const user = (await client.auth.getUser()).data.user;
      if (!user) return null;
      return user.user_metadata?.onboarding_completed === true;
    } catch {
      return null;
    }
  },

  async updateOnboardingMetadata(completed: boolean): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;
    try {
      const { error } = await client.auth.updateUser({
        data: { onboarding_completed: completed },
      });
      return !error;
    } catch {
      return false;
    }
  },

  async createSquad(groupName: string): Promise<{ groupId: string; name: string; inviteCode: string } | null> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const { data, error } = await client.rpc('create_crusade_group', {
      group_name: groupName.trim(),
    });

    if (error) throw error;
    return {
      groupId: data.group_id,
      name: data.name,
      inviteCode: data.invite_code,
    };
  },

  async joinSquadByCode(inviteCode: string): Promise<{ groupId: string; name: string } | null> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const { data, error } = await client.rpc('join_group_by_code', {
      code: inviteCode.trim().toUpperCase(),
    });

    if (error) throw error;
    return {
      groupId: data.group_id,
      name: data.name,
    };
  },

  async regenerateInviteCode(groupId: string): Promise<string> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase is not configured.');

    const { data, error } = await client.rpc('regenerate_invite_code', {
      target_group_id: groupId,
    });

    if (error) throw error;
    return data as string;
  },

  async getMySquads(): Promise<CoopGroup[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from('groups')
      .select('id, name, created_by, invite_code, created_at')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((g) => ({
      id: g.id,
      name: g.name,
      createdBy: g.created_by,
      inviteCode: g.invite_code,
      createdAt: g.created_at,
    }));
  },

  async getSquadMembers(groupId: string): Promise<CoopGroupMember[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from('group_members')
      .select('group_id, user_id, role, joined_at, profiles(display_name, faction_id, avatar_glyph)')
      .eq('group_id', groupId);

    if (error || !data) return [];

    return data.map((m: any) => ({
      groupId: m.group_id,
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      profile: m.profiles
        ? {
            id: m.user_id,
            displayName: m.profiles.display_name,
            factionId: m.profiles.faction_id,
            avatarGlyph: m.profiles.avatar_glyph,
            createdAt: m.joined_at,
          }
        : undefined,
    }));
  },

  async getActiveBoss(groupId: string): Promise<CoopBoss | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from('group_bosses')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      groupId: data.group_id,
      bossKey: data.boss_key,
      name: data.name,
      faction: data.faction,
      loreTitle: data.lore_title,
      glyphName: data.glyph_name,
      primaryColor: data.primary_color,
      maxHp: data.max_hp,
      currentHp: data.current_hp,
      isDefeated: data.is_defeated,
      gloryXp: data.glory_xp,
      createdAt: data.created_at,
      defeatedAt: data.defeated_at,
    };
  },

  async getBossAttacks(bossId: string, limit: number = 30): Promise<CoopAttack[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from('coop_attacks')
      .select('*')
      .eq('group_boss_id', bossId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((a) => ({
      id: a.id,
      groupBossId: a.group_boss_id,
      userId: a.user_id,
      userName: a.user_name,
      clientSetId: a.client_set_id,
      exerciseName: a.exercise_name,
      attackName: a.attack_name,
      styleName: a.style_name,
      damage: a.damage,
      createdAt: a.created_at,
    }));
  },

  /**
   * Subscribes to Realtime Postgres Changes for a shared boss and incoming attacks.
   * Connected clients automatically receive updates as soon as any friend attacks.
   */
  subscribeToBoss(
    bossId: string,
    onBossChange: (bossUpdate: { currentHp: number; isDefeated: boolean }) => void,
    onNewAttack: (attack: CoopAttack) => void
  ): () => void {
    const client = getSupabaseClient();
    if (!client) return () => {};

    const channelName = `boss_room_${bossId}`;
    const channel = client.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'group_bosses',
          filter: `id=eq.${bossId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated) {
            onBossChange({
              currentHp: updated.current_hp,
              isDefeated: updated.is_defeated,
            });
            updateActiveRaidHp(bossId, updated.current_hp, updated.is_defeated);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coop_attacks',
          filter: `group_boss_id=eq.${bossId}`,
        },
        (payload) => {
          const a = payload.new as any;
          if (a) {
            onNewAttack({
              id: a.id,
              groupBossId: a.group_boss_id,
              userId: a.user_id,
              userName: a.user_name,
              clientSetId: a.client_set_id,
              exerciseName: a.exercise_name,
              attackName: a.attack_name,
              styleName: a.style_name,
              damage: a.damage,
              createdAt: a.created_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  },

  /**
   * Records a workout set attack against the shared group boss.
   * 1. Locally buffers in SQLite for guaranteed offline resilience.
   * 2. If online and authenticated, calls the atomic server stored procedure.
   * 3. Prevents duplicate damage via server constraint and client set ID.
   */
  async recordAttack(payload: CoopAttackPayload): Promise<CoopAttackResult> {
    // 1. Local buffer (idempotent)
    enqueueCoopAttack(payload);

    const client = getSupabaseClient();
    if (!client) {
      return {
        status: 'offline_queued',
        message: 'Attack recorded in offline buffer. Supabase credentials required to sync.',
      };
    }

    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return {
        status: 'offline_queued',
        message: 'Attack queued locally. Please sign in to sync with your Crusade Squad.',
      };
    }

    try {
      // 2. Atomic server stored procedure call
      const { data, error } = await client.rpc('record_coop_attack', {
        p_boss_id: payload.groupBossId,
        p_client_set_id: payload.clientSetId,
        p_exercise_name: payload.exerciseName,
        p_attack_name: payload.attackName,
        p_style_name: payload.styleName,
        p_damage: payload.damage,
      });

      if (error) {
        markAttackFailed(payload.clientSetId, error.message);
        return {
          status: 'error',
          message: error.message,
        };
      }

      // Mark locally as synced
      markAttackSynced(payload.clientSetId);

      const status = data?.status === 'duplicate_ignored' ? 'duplicate_ignored' : 'attack_recorded';
      const newHp = data?.new_hp ?? data?.current_hp;
      const isDefeated = Boolean(data?.is_defeated);

      if (typeof newHp === 'number') {
        updateActiveRaidHp(payload.groupBossId, newHp, isDefeated);
      }

      return {
        status,
        damageDealt: data?.damage_dealt ?? payload.damage,
        newHp,
        isDefeated,
      };
    } catch (err: any) {
      markAttackFailed(payload.clientSetId, err?.message ?? 'Network failure');
      return {
        status: 'offline_queued',
        message: 'Connection dropped. Attack safely buffered locally.',
      };
    }
  },

  /**
   * Flushes all offline queued attacks to the remote Supabase database.
   */
  async flushOfflineQueue(): Promise<{ syncedCount: number; errorsCount: number }> {
    const unsynced = getUnsyncedAttacks(50);
    if (unsynced.length === 0) {
      return { syncedCount: 0, errorsCount: 0 };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { syncedCount: 0, errorsCount: unsynced.length };
    }

    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return { syncedCount: 0, errorsCount: unsynced.length };
    }

    let syncedCount = 0;
    let errorsCount = 0;

    for (const item of unsynced) {
      try {
        const { data, error } = await client.rpc('record_coop_attack', {
          p_boss_id: item.groupBossId,
          p_client_set_id: item.clientSetId,
          p_exercise_name: item.exerciseName,
          p_attack_name: item.attackName,
          p_style_name: item.styleName,
          p_damage: item.damage,
        });

        if (error) {
          markAttackFailed(item.clientSetId, error.message);
          errorsCount++;
        } else {
          markAttackSynced(item.clientSetId);
          syncedCount++;
          if (typeof data?.new_hp === 'number') {
            updateActiveRaidHp(item.groupBossId, data.new_hp, Boolean(data.is_defeated));
          }
        }
      } catch (err: any) {
        markAttackFailed(item.clientSetId, err?.message ?? 'Sync failed');
        errorsCount++;
      }
    }

    return { syncedCount, errorsCount };
  },
};

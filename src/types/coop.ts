export interface CoopProfile {
  id: string;
  displayName: string;
  factionId: string;
  avatarGlyph: string;
  createdAt: string;
}

export interface CoopGroup {
  id: string;
  name: string;
  createdBy: string;
  inviteCode: string;
  createdAt: string;
}

export interface CoopGroupMember {
  groupId: string;
  userId: string;
  role: 'leader' | 'member';
  joinedAt: string;
  profile?: CoopProfile;
}

export interface CoopBoss {
  id: string;
  groupId: string;
  bossKey: string;
  name: string;
  faction: string;
  loreTitle: string;
  glyphName: string;
  primaryColor: string;
  maxHp: number;
  currentHp: number;
  isDefeated: boolean;
  gloryXp: number;
  createdAt: string;
  defeatedAt?: string | null;
}

export interface CoopAttack {
  id: string;
  groupBossId: string;
  userId: string;
  userName: string;
  clientSetId: string;
  exerciseName: string;
  attackName: string;
  styleName: string;
  damage: number;
  createdAt: string;
}

/**
 * Sanitized attack payload sent to backend.
 * Notice: Weight, reps, rpe, notes, and personal data are strictly excluded for privacy!
 */
export interface CoopAttackPayload {
  groupBossId: string;
  clientSetId: string;
  exerciseName: string;
  attackName: string;
  styleName: string;
  damage: number;
}

export interface CoopAttackQueueItem {
  id: string;
  groupBossId: string;
  clientSetId: string;
  exerciseName: string;
  attackName: string;
  styleName: string;
  damage: number;
  createdAt: string;
  syncedAt: string | null;
  syncError: string | null;
}

export interface CoopAttackResult {
  status: 'attack_recorded' | 'duplicate_ignored' | 'offline_queued' | 'error';
  damageDealt?: number;
  newHp?: number;
  isDefeated?: boolean;
  message?: string;
}

export interface ActiveCoopRaid {
  groupId: string;
  groupName: string;
  bossId: string;
  bossName: string;
  bossFaction: string;
  bossLore: string;
  bossGlyph: string;
  bossMaxHp: number;
  bossCurrentHp: number;
  isDefeated: boolean;
  updatedAt: string;
}

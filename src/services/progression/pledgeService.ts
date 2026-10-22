declare const require: any;

function getDb() {
  try {
    const { getDatabase } = require('../database/db');
    return getDatabase();
  } catch {
    return null;
  }
}

export interface FactionPledgeSkin {
  pledgeTitle: string;
  allegianceSubtitle: string;
  icon: string;
  primaryColor: string;
  loreQuote: string;
}

export interface ActivePledge {
  id: string;
  targetWorkouts: number;
  targetVolumeKg: number;
  rewardGloryXp: number;
  weekId: string;
  createdAt: string;
  isClaimed: boolean;
}

export interface PledgeProgressView {
  pledge: ActivePledge;
  skin: FactionPledgeSkin;
  completedWorkouts: number;
  completedVolumeKg: number;
  workoutProgressPercent: number;
  isCompleted: boolean;
  canClaim: boolean;
}

/**
 * Returns dynamic faction-skinned aesthetic for weekly vows.
 */
export function getFactionPledgeSkin(factionId: string): FactionPledgeSkin {
  const fid = (factionId || '').toLowerCase();

  if (fid.includes('chaos') || fid.includes('world-eaters') || fid.includes('death-guard') || fid.includes('thousand-sons')) {
    return {
      pledgeTitle: 'BLOOD PACT OF THE RUINOUS POWERS',
      allegianceSubtitle: 'Dark Vow to the Chaos Gods',
      icon: 'flame',
      primaryColor: '#E02424',
      loreQuote: 'Blood for the Blood God! Skulls for the Skull Throne!',
    };
  }

  if (fid.includes('ork')) {
    return {
      pledgeTitle: "DA BOSS'S BRUTAL DARE",
      allegianceSubtitle: 'Waaagh! Feat of Strength',
      icon: 'skull',
      primaryColor: '#057A55',
      loreQuote: "Show 'da Boyz who's got the biggest iron in the galaxy!",
    };
  }

  if (fid.includes('necron')) {
    return {
      pledgeTitle: 'DYNASTIC AWAKENING PROTOCOL',
      allegianceSubtitle: 'Living Metal Directives',
      icon: 'hardware-chip',
      primaryColor: '#00F0FF',
      loreQuote: 'The tomb worlds awaken. Biological frailty is eliminated through discipline.',
    };
  }

  if (fid.includes('tau')) {
    return {
      pledgeTitle: "TA'LISSERA WARRIOR'S VOW",
      allegianceSubtitle: 'For the Greater Good',
      icon: 'disc',
      primaryColor: '#0694A2',
      loreQuote: 'United in purpose, bonded by combat discipline.',
    };
  }

  if (fid.includes('votann') || fid.includes('leagues')) {
    return {
      pledgeTitle: "ANCESTOR'S UNSETTLED GRUDGE",
      allegianceSubtitle: 'Votann League Ledger',
      icon: 'hammer',
      primaryColor: '#D97706',
      loreQuote: 'The Ancestors are watching. Every set settles a score in the great record.',
    };
  }

  if (fid.includes('eldar') || fid.includes('aeldari') || fid.includes('drukhari')) {
    return {
      pledgeTitle: 'PATH OF THE WARRIOR // WAR-MASK',
      allegianceSubtitle: 'Aspect Shrines Discipline',
      icon: 'diamond',
      primaryColor: '#7E3AF2',
      loreQuote: 'Don the war-mask. Let physical perfection transcend mortality.',
    };
  }

  if (fid.includes('tyranid') || fid.includes('genestealer')) {
    return {
      pledgeTitle: 'SYNAPTIC ADAPTATION IMPERATIVE',
      allegianceSubtitle: 'Hive Mind Biological Edict',
      icon: 'git-network',
      primaryColor: '#9061F9',
      loreQuote: 'Adapt, grow stronger, and assimilate all physical resistance.',
    };
  }

  // Default: Imperium (Space Marines, Guard, Custodes, Sisters, Mechanicus, etc.)
  return {
    pledgeTitle: 'OATH OF MOMENT',
    allegianceSubtitle: 'Sacred Crusader Vow of the Imperium',
    icon: 'shield-checkmark',
    primaryColor: '#FFB800',
    loreQuote: 'By the Emperor and the Chapter, my devotion to the iron shall not waver.',
  };
}

/**
 * Computes current ISO week string, e.g. "2026_W42"
 */
export function getCurrentWeekId(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}_W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Generates or retrieves the player's active weekly pledge.
 */
export function getOrCreateActivePledge(activePledgeJson?: string): ActivePledge {
  const currentWeek = getCurrentWeekId();

  if (activePledgeJson) {
    try {
      const parsed: ActivePledge = JSON.parse(activePledgeJson);
      if (parsed.weekId === currentWeek) {
        return parsed;
      }
    } catch {}
  }

  // Create new pledge for this week
  return {
    id: `pledge_${currentWeek}`,
    targetWorkouts: 4,
    targetVolumeKg: 15000,
    rewardGloryXp: 150,
    weekId: currentWeek,
    createdAt: new Date().toISOString(),
    isClaimed: false,
  };
}

/**
 * Calculates weekly training progress from SQLite workout sessions.
 */
export function computePledgeProgress(
  pledge: ActivePledge,
  factionId: string
): PledgeProgressView {
  const db = getDb();
  const skin = getFactionPledgeSkin(factionId);

  // Compute start of current week (Monday midnight)
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);
  const mondayIso = monday.toISOString();

  let completedWorkouts = 0;
  let completedVolumeKg = 0;

  if (db) {
    try {
      const sessionRow = (db.getFirstSync(
        `SELECT COUNT(*) as count FROM workout_sessions 
         WHERE is_completed = 1 AND started_at >= ?`,
        [mondayIso]
      ) as { count: number } | null);
      completedWorkouts = sessionRow?.count || 0;

      const setRows = (db.getAllSync(
        `SELECT s.reps, s.weight, s.unit 
         FROM workout_sets s
         JOIN workout_exercises e ON s.exercise_id = e.id
         JOIN workout_sessions w ON e.session_id = w.id
         WHERE s.is_completed = 1 AND w.is_completed = 1 AND w.started_at >= ?`,
        [mondayIso]
      ) as Array<{ reps: number; weight: number; unit: string }>) || [];

      for (const s of setRows) {
        const weightKg = s.unit === 'kg' ? s.weight : s.weight * 0.45359237;
        completedVolumeKg += Math.round(s.reps * weightKg);
      }
    } catch (err) {
      console.warn('Error computing pledge progress:', err);
    }
  }

  const workoutProgressPercent = Math.min(
    100,
    Math.round((completedWorkouts / pledge.targetWorkouts) * 100)
  );
  const isCompleted = completedWorkouts >= pledge.targetWorkouts;
  const canClaim = isCompleted && !pledge.isClaimed;

  return {
    pledge,
    skin,
    completedWorkouts,
    completedVolumeKg,
    workoutProgressPercent,
    isCompleted,
    canClaim,
  };
}

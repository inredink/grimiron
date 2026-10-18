import {
  CampaignAcademyTemplate,
  UserCampaignEnrollment,
  CampaignChapter,
  CampaignQuest,
  CampaignPhaseReport,
  FinalCampaignDossier,
  CampaignPhaseNumber,
} from '../../types/campaignAcademy';
import { CampaignTelemetryContext } from '../../types/campaign';

/**
 * Pure domain logic for Campaign Academy progression, chapter transitions,
 * quest evaluations, boss battle unlocking, and 30/90-day progress reporting.
 * Decoupled from native SQLite so test suites can run in Node environments.
 */

/**
 * Creates a new enrollment record for a player in a 90-day campaign.
 */
export function createCampaignEnrollment(
  characterId: string,
  campaign: CampaignAcademyTemplate,
  activeProgramEnrollmentId: string
): UserCampaignEnrollment {
  return {
    id: `acad_enroll_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    characterId,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    status: 'active',
    currentPhaseNumber: 1,
    currentChapterNumber: 1,
    activeProgramEnrollmentId,
    startedAt: new Date().toISOString(),
    completedChapterIds: [],
    completedQuestIds: [],
    unlockedBossChapterIds: [],
    defeatedBossChapterIds: [],
    phase1ReportClaimed: false,
    phase2ReportClaimed: false,
    phase3ReportClaimed: false,
    finalDossierClaimed: false,
  };
}

/**
 * Evaluates quest requirements against the player's real-time telemetry.
 * Automatically marks satisfied quests and calculates XP rewards.
 */
export function evaluateCampaignQuests(
  campaign: CampaignAcademyTemplate,
  enrollment: UserCampaignEnrollment,
  telemetry: CampaignTelemetryContext
): {
  updatedCompletedQuestIds: string[];
  newlyCompletedQuests: CampaignQuest[];
  totalXpAwarded: number;
} {
  const existingSet = new Set(enrollment.completedQuestIds);
  const newlyCompletedQuests: CampaignQuest[] = [];
  let totalXpAwarded = 0;

  for (const quest of campaign.quests) {
    if (existingSet.has(quest.id)) continue;

    // Filter quests up to current chapter / phase
    if (quest.phaseNumber > enrollment.currentPhaseNumber) continue;

    let isMet = false;
    switch (quest.metricType) {
      case 'complete_sessions':
        isMet = telemetry.completedProgramSessionsCount >= quest.targetValue;
        break;
      case 'total_volume_kg':
        isMet = telemetry.totalVolumeKg >= quest.targetValue;
        break;
      case 'total_sets':
        isMet = telemetry.totalSets >= quest.targetValue;
        break;
      case 'combat_damage':
        isMet = telemetry.totalCombatDamage >= quest.targetValue;
        break;
      case 'defeat_boss':
        // Check if boss for this chapter was defeated
        const chap = campaign.chapters.find((c) => c.chapterNumber === quest.chapterNumber);
        if (chap && enrollment.defeatedBossChapterIds.includes(chap.id)) {
          isMet = true;
        }
        break;
      case 'exercise_reps':
        // Total workouts or attacks proxy for exercise progression
        isMet = telemetry.totalCombatAttacks >= quest.targetValue || telemetry.totalSets >= 10;
        break;
    }

    if (isMet) {
      existingSet.add(quest.id);
      newlyCompletedQuests.push(quest);
      totalXpAwarded += quest.rewardXp;
    }
  }

  return {
    updatedCompletedQuestIds: Array.from(existingSet),
    newlyCompletedQuests,
    totalXpAwarded,
  };
}

/**
 * Checks whether the current training block satisfies the requirements
 * to unlock the chapter boss.
 *
 * Rule: Meeting the training block requirement unlocks the boss;
 * it does NOT automatically defeat the boss. The player must battle it.
 */
export function evaluateChapterBossUnlock(
  campaign: CampaignAcademyTemplate,
  enrollment: UserCampaignEnrollment,
  completedSessionsInCurrentBlock: number
): {
  isBossUnlocked: boolean;
  chapter: CampaignChapter;
  unlockedBossChapterIds: string[];
} {
  const currentChapter =
    campaign.chapters.find((c) => c.chapterNumber === enrollment.currentChapterNumber) ||
    campaign.chapters[0];

  const unlockedSet = new Set(enrollment.unlockedBossChapterIds);
  let isBossUnlocked = unlockedSet.has(currentChapter.id);

  if (!isBossUnlocked) {
    if (completedSessionsInCurrentBlock >= currentChapter.requiredSessionsCount) {
      unlockedSet.add(currentChapter.id);
      isBossUnlocked = true;
    }
  }

  return {
    isBossUnlocked,
    chapter: currentChapter,
    unlockedBossChapterIds: Array.from(unlockedSet),
  };
}

/**
 * Handles confirmed victory over a chapter boss.
 * Advances chapter, marks phase completion if applicable, and grants chapter rewards.
 */
export function recordBossVictory(
  campaign: CampaignAcademyTemplate,
  enrollment: UserCampaignEnrollment,
  chapterId: string
): {
  updatedEnrollment: UserCampaignEnrollment;
  isPhaseComplete: boolean;
  isCampaignComplete: boolean;
  conferredRewards: any[];
} {
  const chapter = campaign.chapters.find((c) => c.id === chapterId);
  if (!chapter) {
    return {
      updatedEnrollment: enrollment,
      isPhaseComplete: false,
      isCampaignComplete: false,
      conferredRewards: [],
    };
  }

  const defeatedSet = new Set(enrollment.defeatedBossChapterIds);
  defeatedSet.add(chapter.id);

  const completedChapSet = new Set(enrollment.completedChapterIds);
  completedChapSet.add(chapter.id);

  let nextChapterNumber = enrollment.currentChapterNumber;
  let nextPhaseNumber = enrollment.currentPhaseNumber;
  let isPhaseComplete = false;
  let isCampaignComplete = false;
  let completedAt = enrollment.completedAt;

  // Each phase contains 2 chapters (Phase 1: 1 & 2, Phase 2: 3 & 4, Phase 3: 5 & 6)
  if (chapter.chapterNumber === 2 && enrollment.currentPhaseNumber === 1) {
    isPhaseComplete = true;
    nextPhaseNumber = 2;
    nextChapterNumber = 3;
  } else if (chapter.chapterNumber === 4 && enrollment.currentPhaseNumber === 2) {
    isPhaseComplete = true;
    nextPhaseNumber = 3;
    nextChapterNumber = 5;
  } else if (chapter.chapterNumber === 6 && enrollment.currentPhaseNumber === 3) {
    isPhaseComplete = true;
    isCampaignComplete = true;
    completedAt = new Date().toISOString();
  } else if (nextChapterNumber === chapter.chapterNumber) {
    nextChapterNumber = Math.min(6, chapter.chapterNumber + 1);
  }

  const updatedEnrollment: UserCampaignEnrollment = {
    ...enrollment,
    currentChapterNumber: nextChapterNumber,
    currentPhaseNumber: nextPhaseNumber,
    completedChapterIds: Array.from(completedChapSet),
    defeatedBossChapterIds: Array.from(defeatedSet),
    completedAt,
    status: isCampaignComplete ? 'completed' : 'active',
  };

  return {
    updatedEnrollment,
    isPhaseComplete,
    isCampaignComplete,
    conferredRewards: chapter.rewards,
  };
}

/**
 * Generates an objective, verified Phase Report at Days 30, 60, or 90.
 */
export function generatePhaseReport(
  enrollment: UserCampaignEnrollment,
  campaign: CampaignAcademyTemplate,
  phaseNumber: CampaignPhaseNumber,
  telemetry: CampaignTelemetryContext
): CampaignPhaseReport {
  const phaseTitles: Record<CampaignPhaseNumber, string> = {
    1: 'Phase 1: Foundation (Days 1–30)',
    2: 'Phase 2: Development (Days 31–60)',
    3: 'Phase 3: Culmination (Days 61–90)',
  };

  // Find the boss of this phase (Chapters 2, 4, or 6)
  const targetChapterNum = phaseNumber * 2;
  const chapter = campaign.chapters.find((c) => c.chapterNumber === targetChapterNum);

  const summaryNotes: string[] = [
    `Logged ${telemetry.completedProgramSessionsCount} verified sessions in ${campaign.title}.`,
    `Moved cumulative ${telemetry.totalVolumeKg.toLocaleString()} kg volume across ${telemetry.totalSets} working sets.`,
    chapter
      ? `Neutralized Chapter Boss: ${chapter.bossName} (${chapter.bossTitle}).`
      : 'All phase military milestones achieved.',
  ];

  return {
    id: `rep_${enrollment.id}_p${phaseNumber}`,
    enrollmentId: enrollment.id,
    campaignId: campaign.id,
    phaseNumber,
    phaseTitle: phaseTitles[phaseNumber],
    completedAt: new Date().toISOString(),
    sessionsCompleted: telemetry.completedProgramSessionsCount,
    totalVolumeKg: telemetry.totalVolumeKg,
    totalWorkingSets: telemetry.totalSets,
    bossDefeatedName: chapter ? chapter.bossName : 'Sector Commander',
    xpEarned: phaseNumber * 500,
    summaryNotes,
  };
}

/**
 * Generates the Final 90-Day Campaign Completion Dossier.
 */
export function generateFinalDossier(
  enrollment: UserCampaignEnrollment,
  campaign: CampaignAcademyTemplate,
  telemetry: CampaignTelemetryContext
): FinalCampaignDossier {
  const totalPlanned = campaign.programDefinition.blocks.reduce((acc, b) => {
    return acc + b.sessions.filter((s) => !s.isRestDay).length;
  }, 0);

  const adherence =
    totalPlanned > 0
      ? Math.min(100, Math.round((telemetry.completedProgramSessionsCount / totalPlanned) * 100))
      : 100;

  const conferredTitles: string[] = campaign.chapters
    .flatMap((c) => c.rewards)
    .filter((r) => r.type === 'title' && r.title)
    .map((r) => r.title as string);

  return {
    id: `dossier_${enrollment.id}`,
    enrollmentId: enrollment.id,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    experienceLevel: campaign.experienceLevel,
    startedAt: enrollment.startedAt,
    completedAt: enrollment.completedAt || new Date().toISOString(),
    totalSessionsCompleted: telemetry.completedProgramSessionsCount,
    totalPlannedSessions: totalPlanned,
    totalVolumeKg: telemetry.totalVolumeKg,
    totalWorkingSets: telemetry.totalSets,
    chaptersCompletedCount: enrollment.completedChapterIds.length,
    questsCompletedCount: enrollment.completedQuestIds.length,
    bossesDefeatedCount: enrollment.defeatedBossChapterIds.length,
    totalGloryXpAwarded: 5000,
    conferredTitles,
    adherencePercentage: adherence,
  };
}

// In-Memory Storage Adapter for Node CLI test environments and domain testing
const inMemoryEnrollments = new Map<string, UserCampaignEnrollment>();
const inMemoryPhaseReports = new Map<string, CampaignPhaseReport[]>();
const inMemoryFinalDossiers = new Map<string, FinalCampaignDossier>();

export const inMemoryAcademyStorage = {
  saveEnrollment: (enrollment: UserCampaignEnrollment) => {
    inMemoryEnrollments.set(enrollment.id, JSON.parse(JSON.stringify(enrollment)));
  },
  getActiveEnrollment: (characterId: string = 'char_main'): UserCampaignEnrollment | null => {
    for (const e of inMemoryEnrollments.values()) {
      if (e.characterId === characterId && e.status === 'active') {
        return JSON.parse(JSON.stringify(e));
      }
    }
    return null;
  },
  getAllEnrollments: (characterId: string = 'char_main'): UserCampaignEnrollment[] => {
    const list: UserCampaignEnrollment[] = [];
    for (const e of inMemoryEnrollments.values()) {
      if (e.characterId === characterId) {
        list.push(JSON.parse(JSON.stringify(e)));
      }
    }
    return list;
  },
  pauseEnrollment: (enrollmentId: string) => {
    const e = inMemoryEnrollments.get(enrollmentId);
    if (e) {
      e.status = 'paused';
      e.pausedAt = new Date().toISOString();
    }
  },
  resumeEnrollment: (enrollmentId: string) => {
    const e = inMemoryEnrollments.get(enrollmentId);
    if (e) {
      e.status = 'active';
      e.resumedAt = new Date().toISOString();
    }
  },
  savePhaseReport: (report: CampaignPhaseReport) => {
    const list = inMemoryPhaseReports.get(report.enrollmentId) || [];
    const filtered = list.filter((r) => r.phaseNumber !== report.phaseNumber);
    filtered.push(JSON.parse(JSON.stringify(report)));
    inMemoryPhaseReports.set(report.enrollmentId, filtered);
  },
  getPhaseReports: (enrollmentId: string): CampaignPhaseReport[] => {
    return inMemoryPhaseReports.get(enrollmentId) || [];
  },
  saveFinalDossier: (dossier: FinalCampaignDossier) => {
    inMemoryFinalDossiers.set(dossier.enrollmentId, JSON.parse(JSON.stringify(dossier)));
  },
  getFinalDossier: (enrollmentId: string): FinalCampaignDossier | null => {
    return inMemoryFinalDossiers.get(enrollmentId) || null;
  },
  reset: () => {
    inMemoryEnrollments.clear();
    inMemoryPhaseReports.clear();
    inMemoryFinalDossiers.clear();
  },
};


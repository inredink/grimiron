import { TrainingProgramDefinition, ScheduledProgramSession } from './program';
import { CampaignReward } from './campaign';

export type AcademyExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type AcademyGoalCategory =
  | 'strength'
  | 'hypertrophy'
  | 'conditioning'
  | 'calisthenics'
  | 'general_fitness'
  | 'high_volume'
  | 'custom';

export type AcademyEquipmentType =
  | 'full_gym'
  | 'barbell_dumbbell'
  | 'bodyweight_only'
  | 'minimal_equipment';

export type CampaignPhaseNumber = 1 | 2 | 3;

export interface TrainingMethodSource {
  methodName: string;
  historicalBasis: string;
  sourceUrl?: string;
  verifiedAt?: string;
  isOriginalAdaptation: boolean;
  adaptationNotes: string;
}

export interface CampaignQuest {
  id: string;
  chapterNumber: number;
  phaseNumber: CampaignPhaseNumber;
  title: string;
  description: string;
  questType: 'main' | 'side';
  metricType:
    | 'complete_sessions'
    | 'total_volume_kg'
    | 'total_sets'
    | 'defeat_boss'
    | 'combat_damage'
    | 'exercise_reps';
  targetValue: number;
  exerciseRefId?: string;
  rewardXp: number;
  rewardTitle?: string;
}

export interface CampaignChapter {
  id: string;
  chapterNumber: number; // 1 to 6 (2 chapters per 30-day phase)
  phaseNumber: CampaignPhaseNumber;
  title: string;
  subtitle: string;
  narrativeBriefing: string;
  tacticalFocus: string;
  linkedBlockNumber: number;
  requiredSessionsCount: number;
  bossEncounterId: string;
  bossName: string;
  bossTitle: string;
  bossFactionId: string;
  bossMaxHp: number;
  bossGlyph: string;
  bossColor: string;
  bossBriefing: string;
  rewards: CampaignReward[];
}

export interface CampaignAcademyTemplate {
  id: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  overviewNarrative: string;
  experienceLevel: AcademyExperienceLevel;
  goalCategory: AcademyGoalCategory;
  equipment: AcademyEquipmentType;
  durationDays: number; // Nominal 90 days
  durationWeeks: number; // 12-13 weeks
  frequencyDaysPerWeek: number;
  estimatedSessionMinutes: number;
  primaryFactionId?: string;
  trainingMethodSource: TrainingMethodSource;
  programDefinition: TrainingProgramDefinition;
  chapters: CampaignChapter[];
  quests: CampaignQuest[];
  iconName: string;
  primaryColor: string;
  accentColor: string;
  tags: string[];
}

export interface CampaignPhaseReport {
  id: string;
  enrollmentId: string;
  campaignId: string;
  phaseNumber: CampaignPhaseNumber;
  phaseTitle: string;
  completedAt: string;
  sessionsCompleted: number;
  totalVolumeKg: number;
  totalWorkingSets: number;
  bossDefeatedName: string;
  xpEarned: number;
  summaryNotes: string[];
}

export interface FinalCampaignDossier {
  id: string;
  enrollmentId: string;
  campaignId: string;
  campaignTitle: string;
  experienceLevel: AcademyExperienceLevel;
  startedAt: string;
  completedAt: string;
  totalSessionsCompleted: number;
  totalPlannedSessions: number;
  totalVolumeKg: number;
  totalWorkingSets: number;
  chaptersCompletedCount: number;
  questsCompletedCount: number;
  bossesDefeatedCount: number;
  totalGloryXpAwarded: number;
  conferredTitles: string[];
  adherencePercentage: number;
}

export interface UserCampaignEnrollment {
  id: string;
  characterId: string;
  campaignId: string;
  campaignTitle: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  currentPhaseNumber: CampaignPhaseNumber;
  currentChapterNumber: number;
  activeProgramEnrollmentId: string;
  startedAt: string;
  pausedAt?: string;
  resumedAt?: string;
  completedAt?: string;
  completedChapterIds: string[];
  completedQuestIds: string[];
  unlockedBossChapterIds: string[];
  defeatedBossChapterIds: string[];
  phase1ReportClaimed: boolean;
  phase2ReportClaimed: boolean;
  phase3ReportClaimed: boolean;
  finalDossierClaimed: boolean;
}

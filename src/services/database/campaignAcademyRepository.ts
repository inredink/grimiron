import { getDatabase } from './db';
import {
  UserCampaignEnrollment,
  CampaignPhaseReport,
  FinalCampaignDossier,
} from '../../types/campaignAcademy';

// In-Memory Storage Adapter for Node CLI test environments
const inMemoryEnrollments = new Map<string, UserCampaignEnrollment>();
const inMemoryPhaseReports = new Map<string, CampaignPhaseReport[]>();
const inMemoryFinalDossiers = new Map<string, FinalCampaignDossier>();

export const inMemoryAcademyStorage = {
  saveEnrollment: (enrollment: UserCampaignEnrollment) => {
    inMemoryEnrollments.set(enrollment.id, JSON.parse(JSON.stringify(enrollment)));
  },
  getActiveEnrollment: (characterId: string = 'char_main') => {
    for (const e of inMemoryEnrollments.values()) {
      if (e.characterId === characterId && e.status === 'active') {
        return JSON.parse(JSON.stringify(e));
      }
    }
    return null;
  },
  getAllEnrollments: (characterId: string = 'char_main') => {
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
    list.push(JSON.parse(JSON.stringify(report)));
    inMemoryPhaseReports.set(report.enrollmentId, list);
  },
  getPhaseReports: (enrollmentId: string) => {
    return inMemoryPhaseReports.get(enrollmentId) || [];
  },
  saveFinalDossier: (dossier: FinalCampaignDossier) => {
    inMemoryFinalDossiers.set(dossier.enrollmentId, JSON.parse(JSON.stringify(dossier)));
  },
  getFinalDossier: (enrollmentId: string) => {
    return inMemoryFinalDossiers.get(enrollmentId) || null;
  },
  clear: () => {
    inMemoryEnrollments.clear();
    inMemoryPhaseReports.clear();
    inMemoryFinalDossiers.clear();
  },
};

export function saveAcademyEnrollment(enrollment: UserCampaignEnrollment): void {
  try {
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO campaign_academy_enrollments (
        id, character_id, campaign_id, campaign_title, status,
        current_phase_number, current_chapter_number, active_program_enrollment_id,
        started_at, paused_at, resumed_at, completed_at,
        completed_chapter_ids_json, completed_quest_ids_json,
        unlocked_boss_chapter_ids_json, defeated_boss_chapter_ids_json,
        phase1_report_claimed, phase2_report_claimed, phase3_report_claimed,
        final_dossier_claimed, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        enrollment.id,
        enrollment.characterId,
        enrollment.campaignId,
        enrollment.campaignTitle,
        enrollment.status,
        enrollment.currentPhaseNumber,
        enrollment.currentChapterNumber,
        enrollment.activeProgramEnrollmentId,
        enrollment.startedAt,
        enrollment.pausedAt || null,
        enrollment.resumedAt || null,
        enrollment.completedAt || null,
        JSON.stringify(enrollment.completedChapterIds),
        JSON.stringify(enrollment.completedQuestIds),
        JSON.stringify(enrollment.unlockedBossChapterIds),
        JSON.stringify(enrollment.defeatedBossChapterIds),
        enrollment.phase1ReportClaimed ? 1 : 0,
        enrollment.phase2ReportClaimed ? 1 : 0,
        enrollment.phase3ReportClaimed ? 1 : 0,
        enrollment.finalDossierClaimed ? 1 : 0,
        new Date().toISOString(),
      ]
    );
  } catch (err) {
    inMemoryAcademyStorage.saveEnrollment(enrollment);
  }
}

export function getActiveAcademyEnrollment(
  characterId: string = 'char_main'
): UserCampaignEnrollment | null {
  try {
    const db = getDatabase();
    const row = db.getFirstSync<any>(
      `SELECT * FROM campaign_academy_enrollments WHERE character_id = ? AND status = 'active' ORDER BY updated_at DESC LIMIT 1`,
      [characterId]
    );
    if (!row) return inMemoryAcademyStorage.getActiveEnrollment(characterId);

    return {
      id: row.id,
      characterId: row.character_id,
      campaignId: row.campaign_id,
      campaignTitle: row.campaign_title,
      status: row.status,
      currentPhaseNumber: row.current_phase_number,
      currentChapterNumber: row.current_chapter_number,
      activeProgramEnrollmentId: row.active_program_enrollment_id,
      startedAt: row.started_at,
      pausedAt: row.paused_at || undefined,
      resumedAt: row.resumed_at || undefined,
      completedAt: row.completed_at || undefined,
      completedChapterIds: JSON.parse(row.completed_chapter_ids_json || '[]'),
      completedQuestIds: JSON.parse(row.completed_quest_ids_json || '[]'),
      unlockedBossChapterIds: JSON.parse(row.unlocked_boss_chapter_ids_json || '[]'),
      defeatedBossChapterIds: JSON.parse(row.defeated_boss_chapter_ids_json || '[]'),
      phase1ReportClaimed: row.phase1_report_claimed === 1,
      phase2ReportClaimed: row.phase2_report_claimed === 1,
      phase3ReportClaimed: row.phase3_report_claimed === 1,
      finalDossierClaimed: row.final_dossier_claimed === 1,
    };
  } catch (err) {
    return inMemoryAcademyStorage.getActiveEnrollment(characterId);
  }
}

export function getAllAcademyEnrollments(
  characterId: string = 'char_main'
): UserCampaignEnrollment[] {
  try {
    const db = getDatabase();
    const rows = db.getAllSync<any>(
      `SELECT * FROM campaign_academy_enrollments WHERE character_id = ? ORDER BY started_at DESC`,
      [characterId]
    );
    if (!rows || rows.length === 0) return inMemoryAcademyStorage.getAllEnrollments(characterId);

    return rows.map((row) => ({
      id: row.id,
      characterId: row.character_id,
      campaignId: row.campaign_id,
      campaignTitle: row.campaign_title,
      status: row.status,
      currentPhaseNumber: row.current_phase_number,
      currentChapterNumber: row.current_chapter_number,
      activeProgramEnrollmentId: row.active_program_enrollment_id,
      startedAt: row.started_at,
      pausedAt: row.paused_at || undefined,
      resumedAt: row.resumed_at || undefined,
      completedAt: row.completed_at || undefined,
      completedChapterIds: JSON.parse(row.completed_chapter_ids_json || '[]'),
      completedQuestIds: JSON.parse(row.completed_quest_ids_json || '[]'),
      unlockedBossChapterIds: JSON.parse(row.unlocked_boss_chapter_ids_json || '[]'),
      defeatedBossChapterIds: JSON.parse(row.defeated_boss_chapter_ids_json || '[]'),
      phase1ReportClaimed: row.phase1_report_claimed === 1,
      phase2ReportClaimed: row.phase2_report_claimed === 1,
      phase3ReportClaimed: row.phase3_report_claimed === 1,
      finalDossierClaimed: row.final_dossier_claimed === 1,
    }));
  } catch (err) {
    return inMemoryAcademyStorage.getAllEnrollments(characterId);
  }
}

export function pauseAcademyEnrollment(enrollmentId: string): void {
  try {
    const db = getDatabase();
    db.runSync(
      `UPDATE campaign_academy_enrollments SET status = 'paused', paused_at = ?, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), new Date().toISOString(), enrollmentId]
    );
  } catch (err) {
    inMemoryAcademyStorage.pauseEnrollment(enrollmentId);
  }
}

export function resumeAcademyEnrollment(enrollmentId: string): void {
  try {
    const db = getDatabase();
    db.runSync(
      `UPDATE campaign_academy_enrollments SET status = 'active', resumed_at = ?, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), new Date().toISOString(), enrollmentId]
    );
  } catch (err) {
    inMemoryAcademyStorage.resumeEnrollment(enrollmentId);
  }
}

export function savePhaseReport(report: CampaignPhaseReport): void {
  try {
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO campaign_phase_reports (
        id, enrollment_id, campaign_id, phase_number, phase_title,
        completed_at, sessions_completed, total_volume_kg, total_working_sets,
        boss_defeated_name, xp_earned, summary_notes_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        report.id,
        report.enrollmentId,
        report.campaignId,
        report.phaseNumber,
        report.phaseTitle,
        report.completedAt,
        report.sessionsCompleted,
        report.totalVolumeKg,
        report.totalWorkingSets,
        report.bossDefeatedName,
        report.xpEarned,
        JSON.stringify(report.summaryNotes),
        new Date().toISOString(),
      ]
    );
  } catch (err) {
    inMemoryAcademyStorage.savePhaseReport(report);
  }
}

export function getPhaseReports(enrollmentId: string): CampaignPhaseReport[] {
  try {
    const db = getDatabase();
    const rows = db.getAllSync<any>(
      `SELECT * FROM campaign_phase_reports WHERE enrollment_id = ? ORDER BY phase_number ASC`,
      [enrollmentId]
    );
    if (!rows || rows.length === 0) return inMemoryAcademyStorage.getPhaseReports(enrollmentId);

    return rows.map((r) => ({
      id: r.id,
      enrollmentId: r.enrollment_id,
      campaignId: r.campaign_id,
      phaseNumber: r.phase_number,
      phaseTitle: r.phase_title,
      completedAt: r.completed_at,
      sessionsCompleted: r.sessions_completed,
      totalVolumeKg: r.total_volume_kg,
      totalWorkingSets: r.total_working_sets,
      bossDefeatedName: r.boss_defeated_name,
      xpEarned: r.xp_earned,
      summaryNotes: JSON.parse(r.summary_notes_json || '[]'),
    }));
  } catch (err) {
    return inMemoryAcademyStorage.getPhaseReports(enrollmentId);
  }
}

export function saveFinalDossier(dossier: FinalCampaignDossier): void {
  try {
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO campaign_final_dossiers (
        id, enrollment_id, campaign_id, campaign_title, experience_level,
        started_at, completed_at, total_sessions_completed, total_planned_sessions,
        total_volume_kg, total_working_sets, chapters_completed_count,
        quests_completed_count, bosses_defeated_count, total_glory_xp_awarded,
        conferred_titles_json, adherence_percentage, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dossier.id,
        dossier.enrollmentId,
        dossier.campaignId,
        dossier.campaignTitle,
        dossier.experienceLevel,
        dossier.startedAt,
        dossier.completedAt,
        dossier.totalSessionsCompleted,
        dossier.totalPlannedSessions,
        dossier.totalVolumeKg,
        dossier.totalWorkingSets,
        dossier.chaptersCompletedCount,
        dossier.questsCompletedCount,
        dossier.bossesDefeatedCount,
        dossier.totalGloryXpAwarded,
        JSON.stringify(dossier.conferredTitles),
        dossier.adherencePercentage,
        new Date().toISOString(),
      ]
    );
  } catch (err) {
    inMemoryAcademyStorage.saveFinalDossier(dossier);
  }
}

export function getFinalDossier(enrollmentId: string): FinalCampaignDossier | null {
  try {
    const db = getDatabase();
    const row = db.getFirstSync<any>(
      `SELECT * FROM campaign_final_dossiers WHERE enrollment_id = ? LIMIT 1`,
      [enrollmentId]
    );
    if (!row) return inMemoryAcademyStorage.getFinalDossier(enrollmentId);

    return {
      id: row.id,
      enrollmentId: row.enrollment_id,
      campaignId: row.campaign_id,
      campaignTitle: row.campaign_title,
      experienceLevel: row.experience_level,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      totalSessionsCompleted: row.total_sessions_completed,
      totalPlannedSessions: row.total_planned_sessions,
      totalVolumeKg: row.total_volume_kg,
      totalWorkingSets: row.total_working_sets,
      chaptersCompletedCount: row.chapters_completed_count,
      questsCompletedCount: row.quests_completed_count,
      bossesDefeatedCount: row.bosses_defeated_count,
      totalGloryXpAwarded: row.total_glory_xp_awarded,
      conferredTitles: JSON.parse(row.conferred_titles_json || '[]'),
      adherencePercentage: row.adherence_percentage,
    };
  } catch (err) {
    return inMemoryAcademyStorage.getFinalDossier(enrollmentId);
  }
}

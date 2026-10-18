import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { SciFiCard } from './SciFiCard';
import { TerminalButton } from './TerminalButton';
import { ProgressBar } from './ProgressBar';
import { Badge } from './Badge';
import {
  CampaignAcademyTemplate,
  UserCampaignEnrollment,
  CampaignChapter,
  CampaignQuest,
  CampaignPhaseReport,
  FinalCampaignDossier,
  CampaignPhaseNumber,
  AcademyExperienceLevel,
  AcademyGoalCategory,
  AcademyEquipmentType,
} from '../types/campaignAcademy';
import { CampaignTelemetryContext } from '../types/campaign';
import {
  CAMPAIGN_ACADEMY_CATALOG,
  getAcademyCampaignById,
} from '../content/campaignAcademy/catalog';

interface CampaignAcademyModalProps {
  visible: boolean;
  onClose: () => void;
  activeEnrollment: UserCampaignEnrollment | null;
  activeCampaign: CampaignAcademyTemplate | null;
  phaseReports: CampaignPhaseReport[];
  finalDossier: FinalCampaignDossier | null;
  campaignTelemetry: CampaignTelemetryContext;
  onEnrollCampaign: (campaign: CampaignAcademyTemplate) => void;
  onPauseCampaign: () => void;
  onResumeCampaign: () => void;
  onClaimPhaseReport: (phaseNumber: CampaignPhaseNumber) => void;
  onClaimFinalDossier: () => void;
  onDeployChapterBoss: (chapter: CampaignChapter) => void;
}

export const CampaignAcademyModal: React.FC<CampaignAcademyModalProps> = ({
  visible,
  onClose,
  activeEnrollment,
  activeCampaign,
  phaseReports,
  finalDossier,
  campaignTelemetry,
  onEnrollCampaign,
  onPauseCampaign,
  onResumeCampaign,
  onClaimPhaseReport,
  onClaimFinalDossier,
  onDeployChapterBoss,
}) => {
  const [selectedMainTab, setSelectedMainTab] = useState<'roadmap' | 'catalog'>(
    activeEnrollment ? 'roadmap' : 'catalog'
  );
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<AcademyExperienceLevel | 'all'>('all');
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<AcademyGoalCategory | 'all'>('all');
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState<AcademyEquipmentType | 'all'>('all');

  const [inspectCampaign, setInspectCampaign] = useState<CampaignAcademyTemplate | null>(null);
  const [viewingReport, setViewingReport] = useState<CampaignPhaseReport | null>(null);
  const [viewingDossier, setViewingDossier] = useState<FinalCampaignDossier | null>(null);

  // Filter catalog
  const filteredCatalog = useMemo(() => {
    return CAMPAIGN_ACADEMY_CATALOG.filter((camp) => {
      if (selectedLevelFilter !== 'all' && camp.experienceLevel !== selectedLevelFilter) return false;
      if (selectedGoalFilter !== 'all' && camp.goalCategory !== selectedGoalFilter) return false;
      if (selectedEquipmentFilter !== 'all' && camp.equipment !== selectedEquipmentFilter) return false;
      return true;
    });
  }, [selectedLevelFilter, selectedGoalFilter, selectedEquipmentFilter]);

  // Current active chapter
  const currentChapter: CampaignChapter | null = useMemo(() => {
    if (!activeEnrollment || !activeCampaign) return null;
    return (
      activeCampaign.chapters.find((c) => c.chapterNumber === activeEnrollment.currentChapterNumber) ||
      activeCampaign.chapters[0]
    );
  }, [activeEnrollment, activeCampaign]);

  // Calculate total planned non-rest sessions
  const totalPlannedSessions = useMemo(() => {
    if (!activeCampaign) return 36;
    return activeCampaign.programDefinition.blocks.reduce((acc, b) => {
      return acc + b.sessions.filter((s) => !s.isRestDay).length;
    }, 0);
  }, [activeCampaign]);

  // Check boss unlock status
  const isCurrentBossUnlocked = useMemo(() => {
    if (!activeEnrollment || !currentChapter) return false;
    return activeEnrollment.unlockedBossChapterIds.includes(currentChapter.id);
  }, [activeEnrollment, currentChapter]);

  const isCurrentBossDefeated = useMemo(() => {
    if (!activeEnrollment || !currentChapter) return false;
    return activeEnrollment.defeatedBossChapterIds.includes(currentChapter.id);
  }, [activeEnrollment, currentChapter]);

  const handleEnrollClick = (camp: CampaignAcademyTemplate) => {
    if (activeEnrollment && activeEnrollment.campaignId !== camp.id) {
      Alert.alert(
        'Switch 90-Day Campaign Crusade',
        `You are currently enrolled in "${activeEnrollment.campaignTitle}". Switching to "${camp.title}" will preserve your past campaign history and workout logs while initiating this new 90-day crusade. Proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enroll In Campaign',
            onPress: () => {
              onEnrollCampaign(camp);
              setSelectedMainTab('roadmap');
              setInspectCampaign(null);
            },
          },
        ]
      );
    } else {
      onEnrollCampaign(camp);
      setSelectedMainTab('roadmap');
      setInspectCampaign(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>CAMPAIGN ACADEMY</Text>
            <Text style={styles.headerSubtitle}>90-DAY FITNESS CRUSADES // PERIODIZED PROGRESSION</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={THEME.colors.textMain} />
          </TouchableOpacity>
        </View>

        {/* Main Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, selectedMainTab === 'roadmap' && styles.tabButtonActive]}
            onPress={() => setSelectedMainTab('roadmap')}
          >
            <Ionicons
              name="map-outline"
              size={16}
              color={selectedMainTab === 'roadmap' ? THEME.colors.primary : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.tabButtonText,
                selectedMainTab === 'roadmap' && styles.tabButtonTextActive,
              ]}
            >
              ACTIVE ROADMAP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, selectedMainTab === 'catalog' && styles.tabButtonActive]}
            onPress={() => setSelectedMainTab('catalog')}
          >
            <Ionicons
              name="library-outline"
              size={16}
              color={selectedMainTab === 'catalog' ? THEME.colors.primary : THEME.colors.textMuted}
            />
            <Text
              style={[
                styles.tabButtonText,
                selectedMainTab === 'catalog' && styles.tabButtonTextActive,
              ]}
            >
              CRUSADE CATALOG ({CAMPAIGN_ACADEMY_CATALOG.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          {/* ======================================================== */}
          {/* TAB 1: ACTIVE ROADMAP */}
          {/* ======================================================== */}
          {selectedMainTab === 'roadmap' && (
            <View>
              {!activeEnrollment || !activeCampaign ? (
                <SciFiCard title="NO ACTIVE 90-DAY CRUSADE" variant="normal">
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="shield-outline" size={48} color={THEME.colors.primaryMuted} />
                    <Text style={styles.emptyStateTitle}>ENROLL IN A 90-DAY CRUSADE</Text>
                    <Text style={styles.emptyStateText}>
                      Select a structured, science-backed 90-day training campaign. Complete progressive
                      workout sessions, complete narrative chapter quests, breach planetary strongholds,
                      and defeat formidable chapter commanders without arbitrary calendar streak penalties.
                    </Text>
                    <TerminalButton
                      title="EXPLORE 90-DAY CATALOG"
                      onPress={() => setSelectedMainTab('catalog')}
                      variant="primary"
                      size="md"
                      icon={<Ionicons name="compass-outline" size={18} color="#0A0E17" />}
                      style={{ marginTop: 16 }}
                    />
                  </View>
                </SciFiCard>
              ) : (
                <View>
                  {/* Active Campaign Header Card */}
                  <SciFiCard
                    title={`CRUSADE // ${activeCampaign.title.toUpperCase()}`}
                    variant="accent"
                    rightAction={
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Badge
                          label={activeEnrollment.status.toUpperCase()}
                          variant={activeEnrollment.status === 'active' ? 'success' : 'neutral'}
                        />
                        <TouchableOpacity
                          onPress={activeEnrollment.status === 'active' ? onPauseCampaign : onResumeCampaign}
                        >
                          <Ionicons
                            name={activeEnrollment.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
                            size={22}
                            color={THEME.colors.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    }
                  >
                    <Text style={styles.campaignSubtitle}>{activeCampaign.subtitle}</Text>
                    <Text style={styles.campaignOverview}>{activeCampaign.shortDescription}</Text>

                    {/* Non-punitive Adherence Notice */}
                    <View style={styles.adaptiveNoticeBox}>
                      <Ionicons name="infinite-outline" size={18} color={THEME.colors.secondary} />
                      <Text style={styles.adaptiveNoticeText}>
                        ADAPTIVE CRUSADE TIMELINE: Rest days and missed sessions are rescheduled non-punitively.
                        Progress is strictly driven by completed, verified training sessions.
                      </Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={{ marginTop: 14 }}>
                      <ProgressBar
                        progress={
                          totalPlannedSessions > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  (campaignTelemetry.completedProgramSessionsCount / totalPlannedSessions) * 100
                                )
                              )
                            : 0
                        }
                        label={`Crusade Progression (Phase ${activeEnrollment.currentPhaseNumber} / 3)`}
                        valueText={`${campaignTelemetry.completedProgramSessionsCount} / ${totalPlannedSessions} Sessions`}
                        color={THEME.colors.primary}
                        height={8}
                      />
                    </View>

                    {/* Phase Tabs Indicator */}
                    <View style={styles.phaseIndicatorRow}>
                      {[1, 2, 3].map((pNum) => {
                        const phase = pNum as CampaignPhaseNumber;
                        const isCurrent = activeEnrollment.currentPhaseNumber === phase;
                        const isCompleted = activeEnrollment.currentPhaseNumber > phase || activeEnrollment.status === 'completed';
                        return (
                          <View
                            key={phase}
                            style={[
                              styles.phasePill,
                              isCurrent && styles.phasePillCurrent,
                              isCompleted && styles.phasePillCompleted,
                            ]}
                          >
                            <Ionicons
                              name={isCompleted ? 'checkmark-circle' : isCurrent ? 'radio-button-on' : 'radio-button-off'}
                              size={12}
                              color={
                                isCompleted
                                  ? THEME.colors.success
                                  : isCurrent
                                  ? THEME.colors.primary
                                  : THEME.colors.textMuted
                              }
                            />
                            <Text
                              style={[
                                styles.phasePillText,
                                isCurrent && { color: THEME.colors.primary, fontWeight: '700' },
                                isCompleted && { color: THEME.colors.success },
                              ]}
                            >
                              PHASE {phase}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </SciFiCard>

                  {/* Active Chapter Card */}
                  {currentChapter && (
                    <SciFiCard
                      title={`CHAPTER ${currentChapter.chapterNumber} // ${currentChapter.title.toUpperCase()}`}
                      variant="normal"
                    >
                      <Text style={styles.chapterSubtitle}>{currentChapter.subtitle}</Text>
                      <Text style={styles.chapterBriefing}>{currentChapter.narrativeBriefing}</Text>

                      <View style={styles.tacticalFocusBox}>
                        <Ionicons name="scan-outline" size={16} color={THEME.colors.primary} />
                        <Text style={styles.tacticalFocusText}>
                          TACTICAL FOCUS: {currentChapter.tacticalFocus}
                        </Text>
                      </View>

                      {/* Boss Engagement Status */}
                      <View style={styles.bossConfrontationCard}>
                        <View style={styles.bossCardHeader}>
                          <Ionicons
                            name={(currentChapter.bossGlyph as any) || 'skull-outline'}
                            size={22}
                            color={currentChapter.bossColor || THEME.colors.danger}
                          />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.bossNameText}>{currentChapter.bossName}</Text>
                            <Text style={styles.bossTitleText}>{currentChapter.bossTitle}</Text>
                          </View>
                          <Badge
                            label={
                              isCurrentBossDefeated
                                ? 'NEUTRALIZED'
                                : isCurrentBossUnlocked
                                ? 'UNLOCKED'
                                : 'BREACHING'
                            }
                            variant={
                              isCurrentBossDefeated
                                ? 'success'
                                : isCurrentBossUnlocked
                                ? 'danger'
                                : 'neutral'
                            }
                          />
                        </View>

                        <Text style={styles.bossBriefingText}>{currentChapter.bossBriefing}</Text>

                        {/* Boss State Action */}
                        {isCurrentBossDefeated ? (
                          <View style={styles.bossDefeatedBanner}>
                            <Ionicons name="checkmark-done-circle" size={18} color={THEME.colors.success} />
                            <Text style={styles.bossDefeatedText}>
                              COMMANDER NEUTRALIZED // CHAPTER MILESTONE ACHIEVED
                            </Text>
                          </View>
                        ) : isCurrentBossUnlocked ? (
                          <View style={{ marginTop: 12 }}>
                            <TerminalButton
                              title={`ENGAGE SECTOR COMMANDER // ${currentChapter.bossName.toUpperCase()}`}
                              onPress={() => onDeployChapterBoss(currentChapter)}
                              variant="danger"
                              size="md"
                              icon={<Ionicons name="skull-outline" size={18} color="#FFF" />}
                            />
                          </View>
                        ) : (
                          <View style={styles.bossLockedBanner}>
                            <Ionicons name="lock-closed-outline" size={16} color={THEME.colors.warning} />
                            <Text style={styles.bossLockedText}>
                              STRONGHOLD RECON IN PROGRESS: Complete required block training sessions to breach
                              the enemy command bunker.
                            </Text>
                          </View>
                        )}
                      </View>
                    </SciFiCard>
                  )}

                  {/* Active Phase Quests */}
                  <SciFiCard
                    title={`CRUSADE QUESTS // PHASE ${activeEnrollment.currentPhaseNumber}`}
                    variant="normal"
                  >
                    {activeCampaign.quests
                      .filter((q) => q.phaseNumber === activeEnrollment.currentPhaseNumber)
                      .map((quest) => {
                        const isDone = activeEnrollment.completedQuestIds.includes(quest.id);
                        return (
                          <View key={quest.id} style={styles.questItem}>
                            <Ionicons
                              name={isDone ? 'checkbox' : 'square-outline'}
                              size={20}
                              color={isDone ? THEME.colors.success : THEME.colors.textMuted}
                            />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text
                                  style={[
                                    styles.questTitle,
                                    isDone && { textDecorationLine: 'line-through', color: THEME.colors.textMuted },
                                  ]}
                                >
                                  {quest.title}
                                </Text>
                                <Badge
                                  label={quest.questType.toUpperCase()}
                                  variant={quest.questType === 'main' ? 'primary' : 'neutral'}
                                />
                              </View>
                              <Text style={styles.questDesc}>{quest.description}</Text>
                            </View>
                            <Badge label={`+${quest.rewardXp} XP`} variant="primary" />
                          </View>
                        );
                      })}
                  </SciFiCard>

                  {/* Phase Reports & Final Dossier Milestones */}
                  <SciFiCard title="CRUSADE INTELLIGENCE & DOSSIERS" variant="normal">
                    <Text style={styles.dossierIntroText}>
                      Objective 30-day phase reports and the final 90-day campaign dossier are compiled
                      from real telemetry upon neutralizing chapter commanders.
                    </Text>

                    {/* Phase 1 Report Button */}
                    <View style={styles.milestoneRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.milestoneTitle}>Phase 1 Report: Foundation (Day 30)</Text>
                        <Text style={styles.milestoneSubtitle}>Unlocked upon defeating Chapter 2 Commander</Text>
                      </View>
                      {activeEnrollment.phase1ReportClaimed ? (
                        <TouchableOpacity
                          style={styles.viewReportBtn}
                          onPress={() => {
                            const rep = phaseReports.find((r) => r.phaseNumber === 1);
                            if (rep) setViewingReport(rep);
                          }}
                        >
                          <Text style={styles.viewReportBtnText}>VIEW REPORT</Text>
                        </TouchableOpacity>
                      ) : activeEnrollment.defeatedBossChapterIds.length >= 2 ? (
                        <TouchableOpacity
                          style={styles.claimReportBtn}
                          onPress={() => onClaimPhaseReport(1)}
                        >
                          <Text style={styles.claimReportBtnText}>CLAIM (+500 XP)</Text>
                        </TouchableOpacity>
                      ) : (
                        <Badge label="IN PROGRESS" variant="neutral" />
                      )}
                    </View>

                    {/* Phase 2 Report Button */}
                    <View style={styles.milestoneRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.milestoneTitle}>Phase 2 Report: Development (Day 60)</Text>
                        <Text style={styles.milestoneSubtitle}>Unlocked upon defeating Chapter 4 Commander</Text>
                      </View>
                      {activeEnrollment.phase2ReportClaimed ? (
                        <TouchableOpacity
                          style={styles.viewReportBtn}
                          onPress={() => {
                            const rep = phaseReports.find((r) => r.phaseNumber === 2);
                            if (rep) setViewingReport(rep);
                          }}
                        >
                          <Text style={styles.viewReportBtnText}>VIEW REPORT</Text>
                        </TouchableOpacity>
                      ) : activeEnrollment.defeatedBossChapterIds.length >= 4 ? (
                        <TouchableOpacity
                          style={styles.claimReportBtn}
                          onPress={() => onClaimPhaseReport(2)}
                        >
                          <Text style={styles.claimReportBtnText}>CLAIM (+1,000 XP)</Text>
                        </TouchableOpacity>
                      ) : (
                        <Badge label="LOCKED" variant="neutral" />
                      )}
                    </View>

                    {/* Phase 3 Report Button */}
                    <View style={styles.milestoneRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.milestoneTitle}>Phase 3 Report: Culmination (Day 90)</Text>
                        <Text style={styles.milestoneSubtitle}>Unlocked upon defeating Chapter 6 Commander</Text>
                      </View>
                      {activeEnrollment.phase3ReportClaimed ? (
                        <TouchableOpacity
                          style={styles.viewReportBtn}
                          onPress={() => {
                            const rep = phaseReports.find((r) => r.phaseNumber === 3);
                            if (rep) setViewingReport(rep);
                          }}
                        >
                          <Text style={styles.viewReportBtnText}>VIEW REPORT</Text>
                        </TouchableOpacity>
                      ) : activeEnrollment.defeatedBossChapterIds.length >= 6 ? (
                        <TouchableOpacity
                          style={styles.claimReportBtn}
                          onPress={() => onClaimPhaseReport(3)}
                        >
                          <Text style={styles.claimReportBtnText}>CLAIM (+1,500 XP)</Text>
                        </TouchableOpacity>
                      ) : (
                        <Badge label="LOCKED" variant="neutral" />
                      )}
                    </View>

                    {/* Final 90-Day Dossier Button */}
                    <View style={[styles.milestoneRow, { borderBottomWidth: 0 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.milestoneTitle, { color: THEME.colors.primary }]}>
                          FINAL 90-DAY CAMPAIGN DOSSIER
                        </Text>
                        <Text style={styles.milestoneSubtitle}>
                          Comprehensive 90-day audit, adherence %, titles & honors
                        </Text>
                      </View>
                      {activeEnrollment.finalDossierClaimed ? (
                        <TouchableOpacity
                          style={styles.viewReportBtn}
                          onPress={() => {
                            if (finalDossier) setViewingDossier(finalDossier);
                          }}
                        >
                          <Text style={styles.viewReportBtnText}>VIEW DOSSIER</Text>
                        </TouchableOpacity>
                      ) : activeEnrollment.defeatedBossChapterIds.length >= 6 ? (
                        <TouchableOpacity
                          style={[styles.claimReportBtn, { backgroundColor: THEME.colors.primary }]}
                          onPress={onClaimFinalDossier}
                        >
                          <Text style={[styles.claimReportBtnText, { color: '#0A0E17' }]}>
                            CLAIM (+5,000 XP)
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Badge label="LOCKED" variant="neutral" />
                      )}
                    </View>
                  </SciFiCard>
                </View>
              )}
            </View>
          )}

          {/* ======================================================== */}
          {/* TAB 2: CRUSADE CATALOG */}
          {/* ======================================================== */}
          {selectedMainTab === 'catalog' && (
            <View>
              {/* Filter Row: Experience Level */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>EXPERIENCE LEVEL</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
                  {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.filterChip,
                        selectedLevelFilter === lvl && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedLevelFilter(lvl)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedLevelFilter === lvl && styles.filterChipTextActive,
                        ]}
                      >
                        {lvl.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Filter Row: Goals */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>PRIMARY GOAL</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
                  {(['all', 'strength', 'hypertrophy', 'conditioning', 'calisthenics'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.filterChip,
                        selectedGoalFilter === g && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedGoalFilter(g)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedGoalFilter === g && styles.filterChipTextActive,
                        ]}
                      >
                        {g.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Catalog Cards */}
              {filteredCatalog.map((camp) => {
                const isCurrentlyActive = activeEnrollment?.campaignId === camp.id;
                return (
                  <SciFiCard
                    key={camp.id}
                    title={camp.title.toUpperCase()}
                    variant={isCurrentlyActive ? 'accent' : 'normal'}
                    rightAction={
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <Badge label={camp.experienceLevel.toUpperCase()} variant="primary" />
                        <Badge label={camp.goalCategory.toUpperCase()} variant="secondary" />
                      </View>
                    }
                  >
                    <Text style={styles.cardSubtitle}>{camp.subtitle}</Text>
                    <Text style={styles.cardDesc}>{camp.shortDescription}</Text>

                    {/* Methodological Source Pill */}
                    <View style={styles.methodBasisPill}>
                      <Ionicons name="school-outline" size={14} color={THEME.colors.primary} />
                      <Text style={styles.methodBasisText}>
                        Training Basis: {camp.trainingMethodSource.methodName} ({camp.trainingMethodSource.historicalBasis})
                      </Text>
                    </View>

                    {/* Campaign Spec Stats */}
                    <View style={styles.campMetricsRow}>
                      <View style={styles.campMetricItem}>
                        <Ionicons name="calendar-outline" size={14} color={THEME.colors.textMuted} />
                        <Text style={styles.campMetricText}>90 Days // 3 Blocks</Text>
                      </View>
                      <View style={styles.campMetricItem}>
                        <Ionicons name="barbell-outline" size={14} color={THEME.colors.textMuted} />
                        <Text style={styles.campMetricText}>{camp.programDefinition.frequencyDaysPerWeek} Days / Wk</Text>
                      </View>
                      <View style={styles.campMetricItem}>
                        <Ionicons name="skull-outline" size={14} color={THEME.colors.textMuted} />
                        <Text style={styles.campMetricText}>6 Chapter Bosses</Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.cardActionRow}>
                      <TerminalButton
                        title="VIEW 90-DAY CURRICULUM"
                        onPress={() => setInspectCampaign(camp)}
                        variant="outline"
                        size="sm"
                        style={{ flex: 1 }}
                      />
                      <TerminalButton
                        title={isCurrentlyActive ? 'CURRENT CRUSADE' : 'ENROLL'}
                        onPress={() => handleEnrollClick(camp)}
                        variant={isCurrentlyActive ? 'secondary' : 'primary'}
                        size="sm"
                        style={{ flex: 1, marginLeft: 8 }}
                      />
                    </View>
                  </SciFiCard>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* ======================================================== */}
        {/* MODAL 1: INSPECT 90-DAY CURRICULUM DRAWER */}
        {/* ======================================================== */}
        {inspectCampaign && (
          <Modal visible={true} animationType="slide" transparent={false} onRequestClose={() => setInspectCampaign(null)}>
            <SafeAreaView style={styles.container}>
              <View style={styles.header}>
                <View style={styles.headerTitleGroup}>
                  <Text style={styles.headerTitle}>{inspectCampaign.title.toUpperCase()}</Text>
                  <Text style={styles.headerSubtitle}>90-DAY CURRICULUM SPECIFICATION</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setInspectCampaign(null)}>
                  <Ionicons name="close" size={24} color={THEME.colors.textMain} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
                {/* Methodological Transparency Box */}
                <SciFiCard title="VERIFIED TRAINING METHODOLOGY" variant="accent">
                  <Text style={styles.specSectionTitle}>{inspectCampaign.trainingMethodSource.methodName}</Text>
                  <Text style={styles.specBodyText}>
                    <Text style={{ fontWeight: '700', color: THEME.colors.textBright }}>Historical & Scientific Basis: </Text>
                    {inspectCampaign.trainingMethodSource.historicalBasis}
                  </Text>
                  <Text style={[styles.specBodyText, { marginTop: 8 }]}>
                    <Text style={{ fontWeight: '700', color: THEME.colors.textBright }}>Curriculum Adaptation: </Text>
                    {inspectCampaign.trainingMethodSource.adaptationNotes}
                  </Text>
                </SciFiCard>

                {/* 3 Training Blocks */}
                <SciFiCard title="3-BLOCK PERIODIZATION (12 WEEKS // 90 DAYS)" variant="normal">
                  {inspectCampaign.programDefinition.blocks.map((block) => (
                    <View key={block.blockNumber} style={styles.curriculumBlockItem}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.blockTitle}>
                          BLOCK {block.blockNumber}: {block.title.toUpperCase()}
                        </Text>
                        <Badge label={`${block.durationWeeks} WEEKS`} variant="primary" />
                      </View>
                      <Text style={styles.blockFocusText}>Focus: {block.focus}</Text>
                      <Text style={styles.blockSessionsText}>
                        {block.sessions.filter((s) => !s.isRestDay).length} Working Sessions (Rest days rescheduled non-punitively)
                      </Text>
                    </View>
                  ))}
                </SciFiCard>

                {/* 6 Story Chapters and Bosses */}
                <SciFiCard title="6 PROGRESSIVE CHAPTERS & COMMANDERS" variant="normal">
                  {inspectCampaign.chapters.map((ch) => (
                    <View key={ch.id} style={styles.curriculumChapterItem}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.chapterNumText}>CHAPTER {ch.chapterNumber}: {ch.title.toUpperCase()}</Text>
                        <Badge label={`PHASE ${ch.phaseNumber}`} variant="secondary" />
                      </View>
                      <Text style={styles.chapterBriefingText}>{ch.narrativeBriefing}</Text>
                      <View style={styles.chapterBossMiniCard}>
                        <Ionicons name="skull-outline" size={16} color={THEME.colors.danger} />
                        <Text style={styles.chapterBossMiniText}>
                          Commander: {ch.bossName} ({ch.bossTitle}) // {ch.bossMaxHp.toLocaleString()} HP
                        </Text>
                      </View>
                    </View>
                  ))}
                </SciFiCard>

                {/* Sample Weekly Session Prescriptions */}
                <SciFiCard title="SAMPLE TRAINING SESSION PRESCRIPTION" variant="normal">
                  {inspectCampaign.programDefinition.blocks[0]?.sessions.slice(0, 3).map((sess, idx) => (
                    <View key={sess.id} style={styles.sampleSessionBox}>
                      <Text style={styles.sampleSessionTitle}>
                        SESSION {idx + 1}: {sess.title.toUpperCase()}
                      </Text>
                      {sess.exercises.map((ex, exIdx) => (
                        <Text key={exIdx} style={styles.sampleExLine}>
                          • {ex.exerciseName} — {ex.targetSets} sets × {ex.targetRepsMin}-{ex.targetRepsMax} reps (Rest: {ex.restIntervalSeconds || 90}s)
                        </Text>
                      ))}
                    </View>
                  ))}
                </SciFiCard>

                {/* Enroll Button */}
                <TerminalButton
                  title="ENROLL IN THIS 90-DAY CRUSADE"
                  onPress={() => handleEnrollClick(inspectCampaign)}
                  variant="primary"
                  size="lg"
                  icon={<Ionicons name="shield-checkmark-outline" size={20} color="#0A0E17" />}
                  style={{ marginTop: 12, marginBottom: 24 }}
                />
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}

        {/* ======================================================== */}
        {/* MODAL 2: PHASE REPORT VIEWER */}
        {/* ======================================================== */}
        {viewingReport && (
          <Modal visible={true} animationType="fade" transparent={true} onRequestClose={() => setViewingReport(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.reportModalCard}>
                <View style={styles.reportModalHeader}>
                  <Text style={styles.reportModalTitle}>{viewingReport.phaseTitle.toUpperCase()}</Text>
                  <TouchableOpacity onPress={() => setViewingReport(null)}>
                    <Ionicons name="close" size={22} color={THEME.colors.textMain} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 400 }}>
                  <View style={styles.reportMetricGrid}>
                    <View style={styles.reportMetricBox}>
                      <Text style={styles.reportMetricVal}>{viewingReport.sessionsCompleted}</Text>
                      <Text style={styles.reportMetricLbl}>SESSIONS</Text>
                    </View>
                    <View style={styles.reportMetricBox}>
                      <Text style={styles.reportMetricVal}>{viewingReport.totalVolumeKg.toLocaleString()} kg</Text>
                      <Text style={styles.reportMetricLbl}>VOLUME</Text>
                    </View>
                    <View style={styles.reportMetricBox}>
                      <Text style={styles.reportMetricVal}>{viewingReport.totalWorkingSets}</Text>
                      <Text style={styles.reportMetricLbl}>SETS</Text>
                    </View>
                  </View>

                  <View style={styles.reportNeutralizedBox}>
                    <Ionicons name="skull" size={20} color={THEME.colors.danger} />
                    <Text style={styles.reportNeutralizedText}>
                      Neutralized Sector Commander: {viewingReport.bossDefeatedName}
                    </Text>
                  </View>

                  <Text style={styles.reportDebriefTitle}>TACTICAL DEBRIEFING NOTES</Text>
                  {viewingReport.summaryNotes.map((note, idx) => (
                    <Text key={idx} style={styles.reportNoteLine}>• {note}</Text>
                  ))}
                </ScrollView>

                <TerminalButton
                  title="DISMISS REPORT"
                  onPress={() => setViewingReport(null)}
                  variant="outline"
                  size="sm"
                  style={{ marginTop: 16 }}
                />
              </View>
            </View>
          </Modal>
        )}

        {/* ======================================================== */}
        {/* MODAL 3: FINAL 90-DAY DOSSIER VIEWER */}
        {/* ======================================================== */}
        {viewingDossier && (
          <Modal visible={true} animationType="fade" transparent={true} onRequestClose={() => setViewingDossier(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.reportModalCard}>
                <View style={styles.reportModalHeader}>
                  <Text style={[styles.reportModalTitle, { color: THEME.colors.primary }]}>
                    FINAL 90-DAY CRUSADE DOSSIER
                  </Text>
                  <TouchableOpacity onPress={() => setViewingDossier(null)}>
                    <Ionicons name="close" size={22} color={THEME.colors.textMain} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 450 }}>
                  <Text style={styles.dossierCampaignName}>{viewingDossier.campaignTitle.toUpperCase()}</Text>
                  <Text style={styles.dossierDateRange}>
                    Completed: {new Date(viewingDossier.completedAt).toLocaleDateString()} // Adherence: {viewingDossier.adherencePercentage}%
                  </Text>

                  <View style={styles.reportMetricGrid}>
                    <View style={styles.reportMetricBox}>
                      <Text style={styles.reportMetricVal}>{viewingDossier.totalSessionsCompleted}</Text>
                      <Text style={styles.reportMetricLbl}>SESSIONS</Text>
                    </View>
                    <View style={styles.reportMetricBox}>
                      <Text style={styles.reportMetricVal}>{viewingDossier.totalVolumeKg.toLocaleString()} kg</Text>
                      <Text style={styles.reportMetricLbl}>VOLUME</Text>
                    </View>
                    <View style={styles.reportMetricBox}>
                      <Text style={styles.reportMetricVal}>{viewingDossier.bossesDefeatedCount} / 6</Text>
                      <Text style={styles.reportMetricLbl}>BOSSES SLAIN</Text>
                    </View>
                  </View>

                  <View style={styles.dossierHonorsBox}>
                    <Text style={styles.dossierHonorsTitle}>CONFERRED TITLES & COMMENDATIONS</Text>
                    {viewingDossier.conferredTitles.map((t, idx) => (
                      <View key={idx} style={styles.dossierTitleRow}>
                        <Ionicons name="ribbon-outline" size={16} color={THEME.colors.primary} />
                        <Text style={styles.dossierTitleText}>{t}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.dossierXpRewardBox}>
                    <Ionicons name="trophy" size={20} color={THEME.colors.primary} />
                    <Text style={styles.dossierXpRewardText}>
                      Glory Conferred: +{viewingDossier.totalGloryXpAwarded.toLocaleString()} Campaign XP
                    </Text>
                  </View>
                </ScrollView>

                <TerminalButton
                  title="CLOSE DOSSIER"
                  onPress={() => setViewingDossier(null)}
                  variant="primary"
                  size="md"
                  style={{ marginTop: 16 }}
                />
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.surface,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.primary,
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceRaised,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: THEME.colors.primary,
    backgroundColor: THEME.colors.surfaceHighlight,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  tabButtonTextActive: {
    color: THEME.colors.primary,
  },
  contentScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textBright,
    marginTop: 16,
    letterSpacing: 1,
  },
  emptyStateText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  campaignSubtitle: {
    fontSize: 13,
    color: THEME.colors.textBright,
    fontWeight: '600',
    marginBottom: 4,
  },
  campaignOverview: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 18,
  },
  adaptiveNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.secondary,
    padding: 10,
    borderRadius: 4,
    marginTop: 12,
    gap: 10,
  },
  adaptiveNoticeText: {
    flex: 1,
    fontSize: 11,
    color: THEME.colors.secondary,
    lineHeight: 16,
  },
  phaseIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
  },
  phasePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    gap: 4,
  },
  phasePillCurrent: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(229, 169, 60, 0.1)',
  },
  phasePillCompleted: {
    borderColor: THEME.colors.success,
  },
  phasePillText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  chapterSubtitle: {
    fontSize: 13,
    color: THEME.colors.textBright,
    fontWeight: '600',
    marginBottom: 6,
  },
  chapterBriefing: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 18,
  },
  tacticalFocusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceRaised,
    padding: 8,
    borderRadius: 4,
    marginTop: 10,
    gap: 8,
  },
  tacticalFocusText: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  bossConfrontationCard: {
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
  },
  bossCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bossNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textBright,
  },
  bossTitleText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  bossBriefingText: {
    fontSize: 12,
    color: THEME.colors.textMain,
    lineHeight: 18,
  },
  bossDefeatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    padding: 8,
    borderRadius: 4,
    marginTop: 10,
    gap: 8,
  },
  bossDefeatedText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.success,
  },
  bossLockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 171, 0, 0.08)',
    padding: 8,
    borderRadius: 4,
    marginTop: 10,
    gap: 8,
  },
  bossLockedText: {
    flex: 1,
    fontSize: 11,
    color: THEME.colors.warning,
    lineHeight: 16,
  },
  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  questTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textBright,
  },
  questDesc: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  dossierIntroText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textBright,
  },
  milestoneSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  claimReportBtn: {
    backgroundColor: THEME.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  claimReportBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0E17',
  },
  viewReportBtn: {
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  viewReportBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: THEME.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  filterChipActive: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  filterChipTextActive: {
    color: THEME.colors.primary,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textBright,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 18,
  },
  methodBasisPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceRaised,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 10,
    gap: 6,
  },
  methodBasisText: {
    fontSize: 11,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  campMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
  },
  campMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  campMetricText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  cardActionRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  specSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.primary,
    marginBottom: 8,
  },
  specBodyText: {
    fontSize: 12,
    color: THEME.colors.textMain,
    lineHeight: 18,
  },
  curriculumBlockItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  blockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textBright,
  },
  blockFocusText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  blockSessionsText: {
    fontSize: 11,
    color: THEME.colors.secondary,
    marginTop: 2,
  },
  curriculumChapterItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  chapterNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textBright,
  },
  chapterBriefingText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 18,
    marginTop: 4,
  },
  chapterBossMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceRaised,
    padding: 6,
    borderRadius: 4,
    marginTop: 6,
    gap: 6,
  },
  chapterBossMiniText: {
    fontSize: 11,
    color: THEME.colors.danger,
    fontWeight: '600',
  },
  sampleSessionBox: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  sampleSessionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginBottom: 4,
  },
  sampleExLine: {
    fontSize: 11,
    color: THEME.colors.textMain,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reportModalCard: {
    width: '100%',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: 8,
    padding: 16,
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    paddingBottom: 8,
  },
  reportModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textBright,
    letterSpacing: 1,
  },
  reportMetricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  reportMetricBox: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceRaised,
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  reportMetricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  reportMetricLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  reportNeutralizedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 51, 75, 0.1)',
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
    gap: 8,
  },
  reportNeutralizedText: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.danger,
    fontWeight: '600',
  },
  reportDebriefTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textBright,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  reportNoteLine: {
    fontSize: 12,
    color: THEME.colors.textMain,
    lineHeight: 18,
    marginBottom: 4,
  },
  dossierCampaignName: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.primary,
    marginBottom: 4,
  },
  dossierDateRange: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginBottom: 14,
  },
  dossierHonorsBox: {
    backgroundColor: THEME.colors.surfaceRaised,
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  dossierHonorsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  dossierTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dossierTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textBright,
  },
  dossierXpRewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    padding: 12,
    borderRadius: 6,
    gap: 10,
  },
  dossierXpRewardText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
});

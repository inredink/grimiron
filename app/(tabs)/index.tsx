import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { THEME } from '../../src/constants/theme';
import { SciFiCard } from '../../src/components/SciFiCard';
import { ProgressBar } from '../../src/components/ProgressBar';
import { Badge } from '../../src/components/Badge';
import { PlaceholderPortrait } from '../../src/components/PlaceholderPortrait';
import { TerminalButton } from '../../src/components/TerminalButton';
import { CoopRaidModal } from '../../src/components/CoopRaidModal';
import { AchievementToast } from '../../src/components/AchievementToast';
import { AchievementHubModal } from '../../src/components/AchievementHubModal';
import { MissionCenterModal } from '../../src/components/MissionCenterModal';
import { ProgramCenterModal } from '../../src/components/ProgramCenterModal';
import { CampaignMapModal } from '../../src/components/CampaignMapModal';
import { WarfrontDailyBoardModal } from '../../src/components/WarfrontDailyBoardModal';
import { WeeklyRaidModal } from '../../src/components/WeeklyRaidModal';
import { CampaignAcademyModal } from '../../src/components/CampaignAcademyModal';
import { ScheduledProgramSession } from '../../src/types/program';
import { CampaignNode } from '../../src/types/campaign';
import { CampaignChapter } from '../../src/types/campaignAcademy';
import { EncounterTemplate, WeeklyRaidCycle } from '../../src/types/warfront';
import { getMissionById } from '../../src/content/missions/catalog';
import { MissionObjectiveDefinition } from '../../src/types/mission';
import { Ionicons } from '@expo/vector-icons';
import { getRankForXp } from '../../src/content/warhammer40k';

export default function CharacterScreen() {
  const router = useRouter();
  const {
    character,
    progression,
    stats,
    currentFaction,
    currentSubfaction,
    activeWorkout,
    startNewWorkout,
    activeCoopRaid,
    setActiveCoopRaid,
    pendingNotifications,
    dismissPendingNotification,
    activeMissions,
    activeEnrollment,
    campaignTelemetry,
    dailyRotation,
    weeklyRaid,
    warfrontSettings,
    setWarfrontSpawnDay,
    deployDailyEncounter,
    deployWeeklyRaid,
    claimWeeklyRaidRewardsAction,
    enrollInProgram,
    pauseActiveProgram,
    resumeActiveProgram,
    startProgramWorkout,
    logRestDaySessionAction,
    setCurrentMission,
    activeAcademyEnrollment,
    activeAcademyCampaign,
    academyPhaseReports,
    academyFinalDossier,
    enrollInAcademyCampaign,
    pauseAcademyCampaign,
    resumeAcademyCampaign,
    claimAcademyPhaseReport,
    claimAcademyFinalDossier,
    deployChapterBossBattle,
  } = useApp();

  const [isCoopModalVisible, setIsCoopModalVisible] = useState(false);
  const [isAchievementModalVisible, setIsAchievementModalVisible] = useState(false);
  const [isMissionModalVisible, setIsMissionModalVisible] = useState(false);
  const [isProgramModalVisible, setIsProgramModalVisible] = useState(false);
  const [isCampaignModalVisible, setIsCampaignModalVisible] = useState(false);
  const [isDailyBoardModalVisible, setIsDailyBoardModalVisible] = useState(false);
  const [isWeeklyRaidModalVisible, setIsWeeklyRaidModalVisible] = useState(false);
  const [isAcademyModalVisible, setIsAcademyModalVisible] = useState(false);

  const { currentRank } = getRankForXp(currentFaction, character.totalXp);

  const handleStartWorkout = () => {
    if (!activeWorkout) {
      startNewWorkout('Crusade Training');
    }
    router.push('/(tabs)/workout');
  };

  const handleDeployCampaignNode = (node: CampaignNode) => {
    if (node.enemyId) {
      setCurrentMission({
        id: `mission_${node.id}`,
        title: node.title,
        briefing: node.narrativeBriefing,
        difficulty: node.difficulty,
        enemyId: node.enemyId,
        recommendedSets: 6,
        gloryBonusXp: 200,
      });
    }
    if (!activeWorkout) {
      startNewWorkout(`Campaign: ${node.title}`);
    }
    router.push('/(tabs)/workout');
  };

  const handleStartScheduledWorkout = (session: ScheduledProgramSession) => {
    startProgramWorkout(session);
    router.push('/(tabs)/workout');
  };

  const handleDeployDailyEncounter = (encounter: EncounterTemplate) => {
    deployDailyEncounter(encounter);
    router.push('/(tabs)/workout');
  };

  const handleDeployWeeklyRaid = (raid: WeeklyRaidCycle) => {
    deployWeeklyRaid(raid);
    router.push('/(tabs)/workout');
  };

  const handleDeployChapterBoss = (chapter: CampaignChapter) => {
    deployChapterBossBattle(chapter);
    router.push('/(tabs)/workout');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Terminal Header Bar */}
        <View style={styles.terminalHeader}>
          <View style={styles.terminalStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.terminalStatusText}>TACTICAL TERMINAL // ONLINE</Text>
          </View>
          <Text style={styles.terminalDate}>
            M41.{new Date().getFullYear()}
          </Text>
        </View>

        {/* Character Dossier Hero Card */}
        <SciFiCard variant="accent" style={styles.heroCard}>
          <View style={styles.heroContent}>
            {/* 2D Portrait with reticle */}
            <PlaceholderPortrait
              faction={currentFaction}
              subfaction={currentSubfaction}
              currentRank={currentRank}
              level={progression.level}
              size={120}
            />

            {/* Profile Info */}
            <View style={styles.heroDetails}>
              <View style={styles.badgeRow}>
                <Badge
                  label={currentFaction.allegiance}
                  variant={currentFaction.allegiance as any}
                />
                <Badge
                  label={`TIER ${progression.currentRankTier}`}
                  variant="primary"
                  style={{ marginLeft: 6 }}
                />
              </View>

              <Text style={styles.rankTitle} numberOfLines={2}>
                {progression.currentRankTitle.toUpperCase()}
              </Text>

              <Text style={styles.factionName} numberOfLines={1}>
                {currentFaction.name}
              </Text>

              {currentSubfaction && (
                <Text style={styles.subfactionName} numberOfLines={1}>
                  {currentSubfaction.name}
                </Text>
              )}

              {currentSubfaction?.motto && (
                <Text style={styles.mottoText} numberOfLines={1}>
                  "{currentSubfaction.motto}"
                </Text>
              )}
            </View>
          </View>

          {/* Level Progress */}
          <View style={styles.progressSection}>
            <ProgressBar
              progress={progression.progressPercent}
              label={`Level ${progression.level} Progression`}
              valueText={`${progression.xpInCurrentLevel} / ${progression.xpNeededForNextLevel + progression.xpInCurrentLevel} XP (${progression.progressPercent}%)`}
              color={THEME.colors.primary}
              height={10}
            />
            <Text style={styles.xpTotalText}>
              Cumulative Career Glory: <Text style={styles.xpHighlight}>{character.totalXp.toLocaleString()} XP</Text>
            </Text>
          </View>
        </SciFiCard>

        {/* Next Rank Horizon */}
        {progression.nextRankTitle && (
          <SciFiCard
            title="NEXT PROMOTION TARGET"
            rightAction={
              <Text style={styles.remainingXpText}>
                {progression.xpNeededForNextRank} XP TO ADVANCE
              </Text>
            }
          >
            <View style={styles.nextRankRow}>
              <Ionicons
                name="chevron-forward-circle-outline"
                size={22}
                color={THEME.colors.secondary}
              />
              <View style={styles.nextRankInfo}>
                <Text style={styles.nextRankName}>
                  {progression.nextRankTitle}
                </Text>
                <ProgressBar
                  progress={progression.rankProgressPercent}
                  color={THEME.colors.secondary}
                  height={6}
                />
              </View>
            </View>
          </SciFiCard>
        )}

        {/* Active Mission Operations Card */}
        {activeMissions.length > 0 && (() => {
          const firstRecord = activeMissions[0];
          const missionDef = firstRecord.mission || getMissionById(firstRecord.missionId);
          if (!missionDef) return null;
          return (
            <SciFiCard
              title={`ACTIVE DIRECTIVE // ${missionDef.title.toUpperCase()}`}
              variant="accent"
              rightAction={
                <TouchableOpacity onPress={() => setIsMissionModalVisible(true)}>
                  <Text style={styles.manageMissionsText}>
                    VIEW ALL ({activeMissions.length})
                  </Text>
                </TouchableOpacity>
              }
            >
              <Text style={styles.activeMissionDesc} numberOfLines={2}>
                {missionDef.shortDescription}
              </Text>
              {missionDef.objectives.map((obj: MissionObjectiveDefinition) => {
                const progRecord = firstRecord.objectives?.find((o) => o.objectiveId === obj.id);
                const currentVal = progRecord ? progRecord.currentValue : 0;
                const pct = Math.min(100, Math.round((currentVal / obj.targetValue) * 100));
                return (
                  <View key={obj.id} style={{ marginTop: 8 }}>
                    <ProgressBar
                      progress={pct}
                      label={obj.description}
                      valueText={`${currentVal} / ${obj.targetValue}`}
                      color={THEME.colors.primary}
                      height={6}
                    />
                  </View>
                );
              })}
            </SciFiCard>
          );
        })()}

        {/* Active Training Program Card */}
        {activeEnrollment && (
          <SciFiCard
            title={`TRAINING PROGRAM // ${activeEnrollment.programTitle.toUpperCase()}`}
            variant="accent"
            rightAction={
              <TouchableOpacity onPress={() => setIsProgramModalVisible(true)}>
                <Text style={styles.manageMissionsText}>
                  MANAGE SCHEDULE
                </Text>
              </TouchableOpacity>
            }
          >
            <Text style={styles.activeMissionDesc} numberOfLines={2}>
              {activeEnrollment.programSnapshot.shortDescription}
            </Text>
            <ProgressBar
              progress={activeEnrollment.adherencePercent}
              label={`Block ${activeEnrollment.currentBlockNumber} Progress`}
              valueText={`${activeEnrollment.completedSessionsCount} / ${activeEnrollment.totalPlannedSessionsCount} sessions (${activeEnrollment.adherencePercent}%)`}
              color={THEME.colors.primary}
              height={6}
            />
          </SciFiCard>
        )}

        {/* Active 90-Day Campaign Academy Card */}
        {activeAcademyEnrollment && activeAcademyCampaign && (
          <SciFiCard
            title={`90-DAY CRUSADE // ${activeAcademyCampaign.title.toUpperCase()}`}
            variant="accent"
            rightAction={
              <TouchableOpacity onPress={() => setIsAcademyModalVisible(true)}>
                <Text style={styles.manageMissionsText}>
                  MANAGE CRUSADE
                </Text>
              </TouchableOpacity>
            }
          >
            <Text style={styles.activeMissionDesc} numberOfLines={2}>
              {activeAcademyCampaign.subtitle} — Phase {activeAcademyEnrollment.currentPhaseNumber} (Chapter {activeAcademyEnrollment.currentChapterNumber} / 6)
            </Text>
            <ProgressBar
              progress={
                Math.min(
                  100,
                  Math.round(
                    (campaignTelemetry.completedProgramSessionsCount /
                      (activeAcademyCampaign.programDefinition.durationWeeks *
                        activeAcademyCampaign.programDefinition.frequencyDaysPerWeek || 36)) *
                      100
                  )
                )
              }
              label={`Crusade Milestone Progress`}
              valueText={`${campaignTelemetry.completedProgramSessionsCount} Sessions Logged`}
              color={THEME.colors.primary}
              height={6}
            />
          </SciFiCard>
        )}

        {/* Career Statistics */}
        <SciFiCard title="CRUSADE COMBAT METRICS">
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="barbell-outline" size={20} color={THEME.colors.primary} />
              <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
              <Text style={styles.statLabel}>MISSIONS</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="layers-outline" size={20} color={THEME.colors.secondary} />
              <Text style={styles.statValue}>{stats.totalSets}</Text>
              <Text style={styles.statLabel}>SETS LOGGED</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="repeat-outline" size={20} color={THEME.colors.success} />
              <Text style={styles.statValue}>{stats.totalReps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>TOTAL REPS</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="speedometer-outline" size={20} color={THEME.colors.warning} />
              <Text style={styles.statValue}>{stats.totalVolumeKg.toLocaleString()} kg</Text>
              <Text style={styles.statLabel}>WEIGHT MOVED</Text>
            </View>
          </View>
        </SciFiCard>

        {/* Quick Launch Buttons */}
        <View style={styles.actionButtons}>
          <TerminalButton
            title={activeWorkout ? 'RESUME ACTIVE WORKOUT' : 'START NEW WORKOUT'}
            onPress={handleStartWorkout}
            variant="primary"
            size="lg"
            icon={
              <Ionicons
                name="fitness-outline"
                size={20}
                color="#0A0E17"
              />
            }
            style={styles.primaryAction}
          />

          <TerminalButton
            title={
              activeMissions.length > 0
                ? `TACTICAL OPERATIONS // MISSIONS (${activeMissions.length} ACTIVE)`
                : 'TACTICAL OPERATIONS // MISSIONS'
            }
            onPress={() => setIsMissionModalVisible(true)}
            variant={activeMissions.length > 0 ? 'secondary' : 'outline'}
            size="md"
            icon={
              <Ionicons
                name="locate-outline"
                size={18}
                color={THEME.colors.primary}
              />
            }
          />

          <TerminalButton
            title={
              activeEnrollment
                ? `TRAINING PROGRAM // ${activeEnrollment.programCategory.toUpperCase()}`
                : 'TRAINING PROGRAM CENTER'
            }
            onPress={() => setIsProgramModalVisible(true)}
            variant={activeEnrollment ? 'secondary' : 'outline'}
            size="md"
            icon={
              <Ionicons
                name="barbell-outline"
                size={18}
                color={THEME.colors.primary}
              />
            }
          />

          <TerminalButton
            title="PLANETARY CAMPAIGN THEATER MAP"
            onPress={() => setIsCampaignModalVisible(true)}
            variant="outline"
            size="md"
            icon={
              <Ionicons
                name="map-outline"
                size={18}
                color={THEME.colors.primary}
              />
            }
          />

          <TerminalButton
            title="CRUSADE HONORS // ACHIEVEMENTS"
            onPress={() => setIsAchievementModalVisible(true)}
            variant="outline"
            size="md"
            icon={
              <Ionicons
                name="trophy-outline"
                size={18}
                color={THEME.colors.primary}
              />
            }
          />

          <TerminalButton
            title="CRUSADE SQUAD // CO-OP RAID"
            onPress={() => setIsCoopModalVisible(true)}
            variant={activeCoopRaid ? 'primary' : 'outline'}
            size="md"
            icon={
              <Ionicons
                name="people-outline"
                size={18}
                color={THEME.colors.primary}
              />
            }
          />

          <TerminalButton
            title="WARFRONT // DAILY ENGAGEMENTS"
            onPress={() => setIsDailyBoardModalVisible(true)}
            variant="secondary"
            size="md"
            icon={
              <Ionicons
                name="compass-outline"
                size={18}
                color={THEME.colors.primary}
              />
            }
          />

          <TerminalButton
            title={
              weeklyRaid
                ? `WEEKLY RAID // ${weeklyRaid.boss.name.toUpperCase()}`
                : 'WEEKLY RAID BOSS'
            }
            onPress={() => setIsWeeklyRaidModalVisible(true)}
            variant={weeklyRaid?.status === 'active' ? 'primary' : 'outline'}
            size="md"
            icon={
              <Ionicons
                name="skull-outline"
                size={18}
                color={THEME.colors.primary}
              />
            }
          />

          <TerminalButton
            title={
              activeAcademyCampaign
                ? `CAMPAIGN ACADEMY // ${activeAcademyCampaign.title.toUpperCase()}`
                : 'CAMPAIGN ACADEMY // 90-DAY CRUSADES'
            }
            onPress={() => setIsAcademyModalVisible(true)}
            variant={activeAcademyEnrollment ? 'primary' : 'outline'}
            size="md"
            icon={
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={THEME.colors.primary}
              />
            }
          />

          <TerminalButton
            title="BROWSE FACTION CODEX"
            onPress={() => router.push('/(tabs)/factions')}
            variant="outline"
            size="md"
            icon={
              <Ionicons
                name="planet-outline"
                size={16}
                color={THEME.colors.primary}
              />
            }
          />
        </View>
      </ScrollView>

      {/* Floating Achievement Unlock Notification Toast */}
      {pendingNotifications && pendingNotifications.length > 0 && (
        <AchievementToast
          notification={pendingNotifications[0]}
          onDismiss={dismissPendingNotification}
          onPress={() => {
            dismissPendingNotification(pendingNotifications[0].id);
            setIsAchievementModalVisible(true);
          }}
        />
      )}

      {/* Warfront Daily Engagements Board Modal */}
      <WarfrontDailyBoardModal
        visible={isDailyBoardModalVisible}
        onClose={() => setIsDailyBoardModalVisible(false)}
        dailyRotation={dailyRotation}
        onDeployEncounter={handleDeployDailyEncounter}
      />

      {/* Weekly Raid Boss Encounter Modal */}
      <WeeklyRaidModal
        visible={isWeeklyRaidModalVisible}
        onClose={() => setIsWeeklyRaidModalVisible(false)}
        weeklyRaid={weeklyRaid}
        preferredSpawnDay={warfrontSettings.preferredSpawnDay}
        onSetSpawnDay={setWarfrontSpawnDay}
        onDeployRaidWorkout={handleDeployWeeklyRaid}
        onClaimRewards={claimWeeklyRaidRewardsAction}
      />

      {/* 90-Day Campaign Academy Modal */}
      <CampaignAcademyModal
        visible={isAcademyModalVisible}
        onClose={() => setIsAcademyModalVisible(false)}
        activeEnrollment={activeAcademyEnrollment}
        activeCampaign={activeAcademyCampaign}
        phaseReports={academyPhaseReports}
        finalDossier={academyFinalDossier}
        campaignTelemetry={campaignTelemetry}
        onEnrollCampaign={enrollInAcademyCampaign}
        onPauseCampaign={pauseAcademyCampaign}
        onResumeCampaign={resumeAcademyCampaign}
        onClaimPhaseReport={claimAcademyPhaseReport}
        onClaimFinalDossier={claimAcademyFinalDossier}
        onDeployChapterBoss={handleDeployChapterBoss}
      />

      {/* Faction Tactical Operations & Mission Center Modal */}
      <MissionCenterModal
        visible={isMissionModalVisible}
        onClose={() => setIsMissionModalVisible(false)}
      />

      {/* Structured Training Program Center Modal */}
      <ProgramCenterModal
        visible={isProgramModalVisible}
        onClose={() => setIsProgramModalVisible(false)}
        activeEnrollment={activeEnrollment}
        onEnrollProgram={enrollInProgram}
        onPauseProgram={pauseActiveProgram}
        onResumeProgram={resumeActiveProgram}
        onStartScheduledWorkout={handleStartScheduledWorkout}
        onLogRestDay={logRestDaySessionAction}
      />

      {/* Planetary Campaign Theater Map Modal */}
      <CampaignMapModal
        visible={isCampaignModalVisible}
        onClose={() => setIsCampaignModalVisible(false)}
        telemetryContext={campaignTelemetry}
        onDeployNode={handleDeployCampaignNode}
      />

      {/* Cooperative Crusade Squad & Raid Modal */}
      <CoopRaidModal
        visible={isCoopModalVisible}
        onClose={() => setIsCoopModalVisible(false)}
        activeRaid={activeCoopRaid}
        onSelectActiveRaid={setActiveCoopRaid}
      />

      {/* Comprehensive Crusade Achievement Hub */}
      <AchievementHubModal
        visible={isAchievementModalVisible}
        onClose={() => setIsAchievementModalVisible(false)}
        userId="user_main"
        characterId="char_main"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl,
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: 4,
  },
  terminalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.success,
    marginRight: 6,
  },
  terminalStatusText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  terminalDate: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  heroCard: {
    marginTop: 0,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroDetails: {
    flex: 1,
    marginLeft: THEME.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rankTitle: {
    color: THEME.colors.textBright,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  factionName: {
    color: THEME.colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  subfactionName: {
    color: THEME.colors.textMain,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  mottoText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 3,
  },
  progressSection: {
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceBorder,
  },
  xpTotalText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  xpHighlight: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  remainingXpText: {
    color: THEME.colors.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  nextRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextRankInfo: {
    flex: 1,
    marginLeft: 8,
  },
  nextRankName: {
    color: THEME.colors.textBright,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: THEME.colors.surfaceRaised,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  statValue: {
    color: THEME.colors.textBright,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  statLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  actionButtons: {
    marginTop: THEME.spacing.md,
  },
  primaryAction: {
    marginBottom: THEME.spacing.sm,
  },
  manageMissionsText: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  activeMissionDesc: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
});

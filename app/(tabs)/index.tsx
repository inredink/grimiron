import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { CustomSubfactionManagerModal } from '../../src/components/CustomSubfactionManagerModal';
import { TacticalWalkthroughModal } from '../../src/components/TacticalWalkthroughModal';
import { EquipmentSlotCard } from '../../src/components/EquipmentSlotCard';
import { EquipmentInventoryModal } from '../../src/components/EquipmentInventoryModal';
import { EquipmentSlot } from '../../src/types/equipment';
import { ScheduledProgramSession } from '../../src/types/program';
import { CampaignNode } from '../../src/types/campaign';
import { CampaignChapter } from '../../src/types/campaignAcademy';
import { EncounterTemplate, WeeklyRaidCycle } from '../../src/types/warfront';
import { getMissionById } from '../../src/content/missions/catalog';
import { MissionObjectiveDefinition } from '../../src/types/mission';
import { Ionicons } from '@expo/vector-icons';
import { getRankForXp } from '../../src/content/warhammer40k';
import { triggerHaptic } from '../../src/utils/haptics';
import { getRaidTierById } from '../../src/content/raidTiers';

export default function CharacterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    customSubfactions,
    isInitialized,
    settings,
    updateSetting,
    updateCharacterNameAction,
    accountInfo,
    signInCloudAccount,
    signUpCloudAccount,
    resendVerificationEmailAction,
    dailyXpCredited,
    dailyXpRemaining,
    dailyXpCap,
    inventory,
    loadout,
    equippedItems,
    equipmentBonuses,
    gearPowerInfo,
    raidProgression,
    selectedRaidTierId,
    equipItemAction,
    unequipItemAction,
    clearEquipmentAction,
  } = useApp();

  const [isWalkthroughModalVisible, setIsWalkthroughModalVisible] = useState(false);
  const [isEquipmentModalVisible, setIsEquipmentModalVisible] = useState(false);
  const [selectedEquipmentSlot, setSelectedEquipmentSlot] = useState<EquipmentSlot | undefined>(undefined);

  useEffect(() => {
    // Only evaluate after the database and settings have finished initializing from SQLite
    if (!isInitialized) return;

    if (settings && settings.onboarding_completed === false) {
      setIsWalkthroughModalVisible(true);
    } else {
      setIsWalkthroughModalVisible(false);
    }
  }, [isInitialized, settings?.onboarding_completed]);

  const [isCoopModalVisible, setIsCoopModalVisible] = useState(false);
  const [isAchievementModalVisible, setIsAchievementModalVisible] = useState(false);
  const [isMissionModalVisible, setIsMissionModalVisible] = useState(false);
  const [isProgramModalVisible, setIsProgramModalVisible] = useState(false);
  const [isCampaignModalVisible, setIsCampaignModalVisible] = useState(false);
  const [isDailyBoardModalVisible, setIsDailyBoardModalVisible] = useState(false);
  const [isWeeklyRaidModalVisible, setIsWeeklyRaidModalVisible] = useState(false);
  const [isAcademyModalVisible, setIsAcademyModalVisible] = useState(false);
  const [isCustomSubfactionModalVisible, setIsCustomSubfactionModalVisible] = useState(false);

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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(60, insets.bottom + 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Terminal Header Bar */}
        <View style={styles.terminalHeader}>
          <View style={styles.terminalStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.terminalStatusText}>TACTICAL TERMINAL // ONLINE</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.terminalDate, { marginRight: 10 }]}>
              M41.{new Date().getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic.selection();
                router.push('/settings');
              }}
              style={styles.settingsHeaderButton}
              accessibilityLabel="Open Settings"
              accessibilityRole="button"
            >
              <Ionicons name="settings-sharp" size={17} color={THEME.colors.primary} />
            </TouchableOpacity>
          </View>
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
                {(currentSubfaction as any)?.isCustom && (
                  <Badge
                    label="CUSTOM SUBFACTION"
                    variant="secondary"
                    style={{ marginLeft: 6 }}
                  />
                )}
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

              {Boolean((currentSubfaction as any)?.homeworld?.trim()) ? (
                <Text style={styles.homeworldDossierText} numberOfLines={1}>
                  Base: {(currentSubfaction as any).homeworld}
                </Text>
              ) : null}

              {Boolean(currentSubfaction?.motto?.trim()) ? (
                <Text style={styles.mottoText} numberOfLines={1}>
                  "{currentSubfaction?.motto}"
                </Text>
              ) : null}
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

        {/* Equipped Arsenal & Wargear Card */}
        <EquipmentSlotCard
          factionId={currentFaction.id}
          loadout={loadout}
          equippedItems={equippedItems}
          equipmentBonuses={equipmentBonuses}
          gearPower={gearPowerInfo.gearPower}
          gearTierLabel={gearPowerInfo.primaryTierLabel}
          onOpenInventory={(slot) => {
            setSelectedEquipmentSlot(slot);
            setIsEquipmentModalVisible(true);
          }}
        />

        {/* Next Rank Horizon */}
        {progression.nextRankTitle && (
          <SciFiCard
            title="NEXT PROMOTION TARGET"
            rightAction={
              <Text style={styles.remainingXpText}>
                {(progression.xpNeededForNextRank ?? 0).toLocaleString()} XP TO ADVANCE
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

            {progression.isRankTrialPending && (
              <View style={styles.trialAlertRow}>
                <Ionicons name="alert-circle" size={16} color="#FFB800" />
                <Text style={styles.trialAlertText}>
                  {progression.pendingMilestoneRequirement}
                </Text>
              </View>
            )}
          </SciFiCard>
        )}

        {/* MMORPG Raid Progression Horizon */}
        <SciFiCard
          title="CRUSADE RAID CLEARANCE HORIZON"
          variant="normal"
          rightAction={
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/raid')}
              style={styles.raidSectorBtn}
            >
              <Text style={styles.raidSectorBtnText}>VIEW LADDER</Text>
            </TouchableOpacity>
          }
        >
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/raid')}
            activeOpacity={0.8}
          >
            <View style={styles.raidHorizonRow}>
              <View style={styles.raidTierBadge}>
                <Ionicons name="shield-checkmark" size={20} color="#00E676" />
                <View style={styles.raidTierInfo}>
                  <Text style={styles.raidTierLabel}>HIGHEST RAID TIER UNLOCKED</Text>
                  <Text style={styles.raidTierName}>
                    {getRaidTierById(raidProgression.highestTierUnlocked).name.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.raidVictoriesBox}>
                <Text style={styles.raidVictoriesLabel}>RAIDS SLAIN</Text>
                <Text style={styles.raidVictoriesValue}>{raidProgression.totalRaidVictories}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </SciFiCard>

        {/* Daily Training Quota & Cap Telemetry */}
        <SciFiCard
          title="DAILY TRAINING QUOTA"
          rightAction={
            <Text style={[styles.dailyQuotaHeaderTag, dailyXpRemaining === 0 ? styles.dailyQuotaHeaderTagCapped : null]}>
              {dailyXpRemaining === 0 ? 'CAP REACHED' : `${dailyXpRemaining.toLocaleString()} XP REMAINING`}
            </Text>
          }
        >
          <View style={styles.dailyQuotaSection}>
            <ProgressBar
              progress={Math.min(100, Math.round((dailyXpCredited / dailyXpCap) * 100))}
              label="Today's Credited XP"
              valueText={`${dailyXpCredited.toLocaleString()} / ${dailyXpCap.toLocaleString()} XP (${Math.min(100, Math.round((dailyXpCredited / dailyXpCap) * 100))}%)`}
              color={dailyXpRemaining === 0 ? THEME.colors.warning : THEME.colors.primary}
              height={8}
            />
            <View style={styles.dailyQuotaMetaRow}>
              <Ionicons
                name={dailyXpRemaining === 0 ? "shield-checkmark" : "time-outline"}
                size={14}
                color={dailyXpRemaining === 0 ? THEME.colors.warning : THEME.colors.textMuted}
              />
              <Text style={styles.dailyQuotaMetaText}>
                {dailyXpRemaining === 0
                  ? 'Daily training cap reached. Full XP earnings refresh at local midnight.'
                  : `Hard cap: ${dailyXpCap.toLocaleString()} XP/day. Repeatable workouts & missions contribute.`}
              </Text>
            </View>
          </View>
        </SciFiCard>

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
              <TouchableOpacity
                onPress={() => setIsMissionModalVisible(true)}
                activeOpacity={0.8}
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
                <Text style={{ fontSize: 10, color: THEME.colors.primary, marginTop: 8, fontWeight: '700' }}>
                  Tap to view operation details & objective requirements ›
                </Text>
              </TouchableOpacity>
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
            title={`CRUSADE ARSENAL // WARGEAR (${inventory.length} ITEMS)`}
            onPress={() => {
              setSelectedEquipmentSlot(undefined);
              setIsEquipmentModalVisible(true);
            }}
            variant="secondary"
            size="md"
            icon={
              <Ionicons
                name="shield-outline"
                size={18}
                color={THEME.colors.primary}
              />
            }
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
                ? `CRUSADE RAID // ${weeklyRaid.boss.name.toUpperCase()} (T${getRaidTierById(selectedRaidTierId).tierNumber})`
                : 'CRUSADE RAIDS // 7 TIERS'
            }
            onPress={() => router.push('/(tabs)/raid')}
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
            title={
              (currentSubfaction as any)?.isCustom
                ? `CUSTOM SUBFACTION // ${currentSubfaction?.name?.toUpperCase() || 'CUSTOM'}`
                : customSubfactions.length > 0
                ? `MY SUBFACTIONS (${customSubfactions.length} CREATED)`
                : 'FOUND CUSTOM SUBFACTION'
            }
            onPress={() => setIsCustomSubfactionModalVisible(true)}
            variant={(currentSubfaction as any)?.isCustom ? 'secondary' : 'outline'}
            size="md"
            icon={
              <Ionicons
                name="flag-outline"
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

      {/* First-Time Tactical Walkthrough & Account Directives Modal */}
      <TacticalWalkthroughModal
        visible={isWalkthroughModalVisible}
        onClose={() => setIsWalkthroughModalVisible(false)}
        currentCallsign={character.characterName}
        onSaveCallsign={updateCharacterNameAction}
        onCompleteOnboarding={() => updateSetting('onboarding_completed', true)}
        onOpenCloudAuth={() => {
          setIsWalkthroughModalVisible(false);
          router.push({
            pathname: '/settings',
            params: { category: 'privacy', openAuth: 'true', returnWalkthrough: 'true' },
          });
        }}
        isCloudAuthenticated={accountInfo?.isCloudAuthenticated || false}
        cloudEmail={accountInfo?.email}
        onSignUpCloud={signUpCloudAccount}
        onSignInCloud={signInCloudAccount}
        onResendVerification={resendVerificationEmailAction}
      />

      {/* Comprehensive Crusade Achievement Hub */}
      <AchievementHubModal
        visible={isAchievementModalVisible}
        onClose={() => setIsAchievementModalVisible(false)}
        userId="user_main"
        characterId="char_main"
        characterFactionId={currentFaction.id}
      />

      {/* Custom Subfaction Manager Modal */}
      <CustomSubfactionManagerModal
        visible={isCustomSubfactionModalVisible}
        onClose={() => setIsCustomSubfactionModalVisible(false)}
        defaultParentFactionId={currentFaction.id}
      />

      {/* Crusade Equipment & Inventory Manager Modal */}
      <EquipmentInventoryModal
        visible={isEquipmentModalVisible}
        onClose={() => {
          setIsEquipmentModalVisible(false);
          setSelectedEquipmentSlot(undefined);
        }}
        factionId={currentFaction.id}
        characterLevel={progression.level}
        characterRankTier={progression.currentRankTier}
        inventory={inventory}
        loadout={loadout}
        equippedItems={equippedItems}
        equipmentBonuses={equipmentBonuses}
        initialSelectedSlot={selectedEquipmentSlot}
        onEquipItem={(slot, itemId) => {
          equipItemAction(slot, itemId);
        }}
        onUnequipItem={(slot) => {
          unequipItemAction(slot);
        }}
        onClearEquipment={clearEquipmentAction}
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
  settingsHeaderButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
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
  homeworldDossierText: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
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
  dailyQuotaHeaderTag: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  dailyQuotaHeaderTagCapped: {
    color: THEME.colors.warning,
  },
  dailyQuotaSection: {
    gap: 6,
  },
  dailyQuotaMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dailyQuotaMetaText: {
    flex: 1,
    color: THEME.colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
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
  trialAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderWidth: 1,
    borderColor: '#FFB800',
    borderRadius: 6,
    padding: 8,
    marginTop: 10,
  },
  trialAlertText: {
    flex: 1,
    fontSize: 11,
    color: '#FFB800',
    fontWeight: '700',
    lineHeight: 15,
  },
  raidSectorBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: `${THEME.colors.primary}20`,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  raidSectorBtnText: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  raidHorizonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  raidTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  raidTierInfo: {
    flex: 1,
  },
  raidTierLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  raidTierName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00E676',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  raidVictoriesBox: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  raidVictoriesLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  raidVictoriesValue: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.primary,
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
